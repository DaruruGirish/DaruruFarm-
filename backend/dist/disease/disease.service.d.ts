import { Repository } from 'typeorm';
import { DiseaseEvent } from './disease-event.entity';
import { DiseasePrediction } from './disease-prediction.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import { WeatherService } from '../weather/weather.service';
import { PomegranateFruitPipelineService } from './pomegranate-fruit-pipeline.service';
import { GalleryService } from '../gallery/gallery.service';
export declare class DiseaseService {
    private diseaseRepository;
    private predictionRepository;
    private farmRepository;
    private userRepository;
    private weatherService;
    private fruitPipeline;
    private galleryService;
    constructor(diseaseRepository: Repository<DiseaseEvent>, predictionRepository: Repository<DiseasePrediction>, farmRepository: Repository<Farm>, userRepository: Repository<User>, weatherService: WeatherService, fruitPipeline: PomegranateFruitPipelineService, galleryService: GalleryService);
    private requirePremium;
    create(filename: string, diseaseName: string, temp: number, humidity: number, rainfall: number, farmId: number, user: User): Promise<DiseaseEvent>;
    findAll(user: User): Promise<DiseaseEvent[]>;
    findOne(id: number, user: User): Promise<DiseaseEvent>;
    remove(id: number, user: User): Promise<void>;
    findPredictions(user: User): Promise<DiseasePrediction[]>;
    analyzeGalleryImage(galleryImageId: number, user: User): Promise<{
        id: number;
        disease: string;
        confidence: number;
        severity: "LOW" | "HIGH" | "MEDIUM" | null;
        heatmap: string | null;
        recommendations: {
            explanation: string;
            immediateActions: string[];
            treatmentOptions: string[];
            bestPractices: string[];
            monitoring: string[];
        };
        imageUrl: string;
        plantPart: string;
        uncertain: boolean;
        topPredictions: {
            disease: string;
            confidence: number;
        }[];
        farm: {
            id: number;
            name: string;
        } | null;
        createdAt: Date;
    }>;
    analyzeFruit(filename: string, farmId: number | null, user: User): Promise<{
        id: number;
        disease: string;
        confidence: number;
        severity: "LOW" | "HIGH" | "MEDIUM" | null;
        heatmap: string | null;
        recommendations: {
            explanation: string;
            immediateActions: string[];
            treatmentOptions: string[];
            bestPractices: string[];
            monitoring: string[];
        };
        imageUrl: string;
        plantPart: string;
        uncertain: boolean;
        topPredictions: {
            disease: string;
            confidence: number;
        }[];
        farm: {
            id: number;
            name: string;
        } | null;
        createdAt: Date;
    }>;
    predictPomegranateBacterialBlight(farmId: number, user: User): Promise<{
        farm: {
            id: number;
            name: string;
        };
        weatherFetchedAt: string;
        disease: "Pomegranate Bacterial Blight";
        score: number;
        riskLevel: import("./pomegranate-bacterial-blight-risk").BlightRiskLevel;
        summary: string;
        reasons: string[];
        topFactors: import("./pomegranate-bacterial-blight-risk").BlightRiskFactor[];
        factors: import("./pomegranate-bacterial-blight-risk").BlightRiskFactor[];
        inputs: import("./pomegranate-bacterial-blight-risk").BlightWeatherInputs;
        disclaimer: string;
    }>;
}
