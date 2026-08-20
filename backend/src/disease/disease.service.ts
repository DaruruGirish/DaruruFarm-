import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiseaseEvent } from './disease-event.entity';
import { DiseasePrediction } from './disease-prediction.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import { assertPremiumAccess } from '../auth/premium-access';
import { WeatherService } from '../weather/weather.service';
import { calculatePomegranateBacterialBlightRisk } from './pomegranate-bacterial-blight-risk';
import { PomegranateFruitPipelineService } from './pomegranate-fruit-pipeline.service';
import { GalleryService } from '../gallery/gallery.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectRepository(DiseaseEvent)
    private diseaseRepository: Repository<DiseaseEvent>,
    @InjectRepository(DiseasePrediction)
    private predictionRepository: Repository<DiseasePrediction>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private weatherService: WeatherService,
    private fruitPipeline: PomegranateFruitPipelineService,
    private galleryService: GalleryService,
  ) {}

  private async requirePremium(userId: number, featureLabel: string) {
    const owner = await this.userRepository.findOne({ where: { id: userId } });
    assertPremiumAccess(owner, featureLabel);
  }

  // Log a new crop disease incident
  async create(
    filename: string,
    diseaseName: string,
    temp: number,
    humidity: number,
    rainfall: number,
    farmId: number,
    user: User,
  ): Promise<DiseaseEvent> {
    await this.requirePremium(user.id, 'Detect Disease');
    const farm = await this.farmRepository.findOne({
      where: { id: farmId, user: { id: user.id } },
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
    }

    const event = this.diseaseRepository.create({
      filename,
      diseaseName,
      temp,
      humidity,
      rainfall,
      farm,
      user,
    });

    return this.diseaseRepository.save(event);
  }

  // Get all logged disease incidents for the user
  async findAll(user: User): Promise<DiseaseEvent[]> {
    await this.requirePremium(user.id, 'Detect Disease');
    return this.diseaseRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { detectedAt: 'DESC', id: 'DESC' },
    });
  }

  // Find a specific incident
  async findOne(id: number, user: User): Promise<DiseaseEvent> {
    const event = await this.diseaseRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: { farm: true },
    });
    if (!event) {
      throw new NotFoundException(`Disease incident with ID ${id} not found`);
    }
    return event;
  }

  async remove(id: number, user: User): Promise<void> {
    const event = await this.findOne(id, user);
    const filePath = join(process.cwd(), 'uploads', event.filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete file from disk: ${filePath}`, err);
    }

    await this.diseaseRepository.remove(event);
  }

  async findPredictions(user: User): Promise<DiseasePrediction[]> {
    await this.requirePremium(user.id, 'Detect Disease');
    return this.predictionRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async analyzeGalleryImage(galleryImageId: number, user: User) {
    const image = await this.galleryService.findOne(galleryImageId, user);
    return this.analyzeFruit(image.filename, image.farm?.id ?? null, user);
  }

  async analyzeFruit(filename: string, farmId: number | null, user: User) {
    await this.requirePremium(user.id, 'Detect Disease');

    let farm: Farm | null = null;
    if (farmId != null) {
      farm = await this.farmRepository.findOne({
        where: { id: farmId, user: { id: user.id } },
      });
      if (!farm) {
        throw new NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
      }
    }

    const imagePath = join(process.cwd(), 'uploads', filename);
    const heatmapDir = join(process.cwd(), 'uploads', 'heatmaps');
    const result = await this.fruitPipeline.analyzeFruitImage(imagePath, heatmapDir);

    const confidencePct = Math.round(result.confidence * 10000) / 100;
    const topPredictions = Object.entries(result.classProbabilities || {})
      .map(([disease, conf]) => ({
        disease,
        confidence: Math.round(Number(conf) * 10000) / 100,
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const prediction = this.predictionRepository.create({
      imageUrl: filename,
      predictedDisease: result.disease,
      confidence: confidencePct,
      plantPart: 'fruit',
      uncertain: confidencePct < 70,
      topPredictions,
      severity: result.severity,
      heatmapUrl: result.heatmap ? `heatmaps/${result.heatmap}` : null,
      recommendations: result.recommendations,
      farm,
      user,
    });

    const saved = await this.predictionRepository.save(prediction);

    return {
      id: saved.id,
      disease: result.disease,
      confidence: result.confidence,
      severity: result.severity,
      heatmap: saved.heatmapUrl,
      recommendations: result.recommendations,
      imageUrl: filename,
      plantPart: 'fruit',
      uncertain: saved.uncertain,
      topPredictions,
      farm: farm ? { id: farm.id, name: farm.name } : null,
      createdAt: saved.createdAt,
    };
  }

  async predictPomegranateBacterialBlight(farmId: number, user: User) {
    await this.requirePremium(user.id, 'Analysis');
    const farm = await this.farmRepository.findOne({
      where: { id: farmId, user: { id: user.id } },
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
    }
    if (farm.latitude == null || farm.longitude == null) {
      throw new BadRequestException('Save the farm location before calculating bacterial blight risk.');
    }

    const series = await this.weatherService.getBlightWeatherSeries(
      Number(farm.latitude),
      Number(farm.longitude),
    );

    const result = calculatePomegranateBacterialBlightRisk(series);
    return {
      ...result,
      farm: { id: farm.id, name: farm.name },
      weatherFetchedAt: series.fetchedAt,
    };
  }
}
