"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const disease_event_entity_1 = require("./disease-event.entity");
const disease_prediction_entity_1 = require("./disease-prediction.entity");
const farm_entity_1 = require("../farm/farm.entity");
const user_entity_1 = require("../auth/user.entity");
const premium_access_1 = require("../auth/premium-access");
const weather_service_1 = require("../weather/weather.service");
const pomegranate_bacterial_blight_risk_1 = require("./pomegranate-bacterial-blight-risk");
const pomegranate_fruit_pipeline_service_1 = require("./pomegranate-fruit-pipeline.service");
const gallery_service_1 = require("../gallery/gallery.service");
const fs = __importStar(require("fs"));
const path_1 = require("path");
let DiseaseService = class DiseaseService {
    diseaseRepository;
    predictionRepository;
    farmRepository;
    userRepository;
    weatherService;
    fruitPipeline;
    galleryService;
    constructor(diseaseRepository, predictionRepository, farmRepository, userRepository, weatherService, fruitPipeline, galleryService) {
        this.diseaseRepository = diseaseRepository;
        this.predictionRepository = predictionRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.weatherService = weatherService;
        this.fruitPipeline = fruitPipeline;
        this.galleryService = galleryService;
    }
    async requirePremium(userId, featureLabel) {
        const owner = await this.userRepository.findOne({ where: { id: userId } });
        (0, premium_access_1.assertPremiumAccess)(owner, featureLabel);
    }
    async create(filename, diseaseName, temp, humidity, rainfall, farmId, user) {
        await this.requirePremium(user.id, 'Detect Disease');
        const farm = await this.farmRepository.findOne({
            where: { id: farmId, user: { id: user.id } },
        });
        if (!farm) {
            throw new common_1.NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
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
    async findAll(user) {
        await this.requirePremium(user.id, 'Detect Disease');
        return this.diseaseRepository.find({
            where: { user: { id: user.id } },
            relations: { farm: true },
            order: { detectedAt: 'DESC', id: 'DESC' },
        });
    }
    async findOne(id, user) {
        const event = await this.diseaseRepository.findOne({
            where: { id, user: { id: user.id } },
            relations: { farm: true },
        });
        if (!event) {
            throw new common_1.NotFoundException(`Disease incident with ID ${id} not found`);
        }
        return event;
    }
    async remove(id, user) {
        const event = await this.findOne(id, user);
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', event.filename);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (err) {
            console.error(`Failed to delete file from disk: ${filePath}`, err);
        }
        await this.diseaseRepository.remove(event);
    }
    async findPredictions(user) {
        await this.requirePremium(user.id, 'Detect Disease');
        return this.predictionRepository.find({
            where: { user: { id: user.id } },
            relations: { farm: true },
            order: { createdAt: 'DESC', id: 'DESC' },
        });
    }
    async analyzeGalleryImage(galleryImageId, user) {
        const image = await this.galleryService.findOne(galleryImageId, user);
        return this.analyzeFruit(image.filename, image.farm?.id ?? null, user);
    }
    async analyzeFruit(filename, farmId, user) {
        await this.requirePremium(user.id, 'Detect Disease');
        let farm = null;
        if (farmId != null) {
            farm = await this.farmRepository.findOne({
                where: { id: farmId, user: { id: user.id } },
            });
            if (!farm) {
                throw new common_1.NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
            }
        }
        const imagePath = (0, path_1.join)(process.cwd(), 'uploads', filename);
        const heatmapDir = (0, path_1.join)(process.cwd(), 'uploads', 'heatmaps');
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
    async predictPomegranateBacterialBlight(farmId, user) {
        await this.requirePremium(user.id, 'Analysis');
        const farm = await this.farmRepository.findOne({
            where: { id: farmId, user: { id: user.id } },
        });
        if (!farm) {
            throw new common_1.NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
        }
        if (farm.latitude == null || farm.longitude == null) {
            throw new common_1.BadRequestException('Save the farm location before calculating bacterial blight risk.');
        }
        const series = await this.weatherService.getBlightWeatherSeries(Number(farm.latitude), Number(farm.longitude));
        const result = (0, pomegranate_bacterial_blight_risk_1.calculatePomegranateBacterialBlightRisk)(series);
        return {
            ...result,
            farm: { id: farm.id, name: farm.name },
            weatherFetchedAt: series.fetchedAt,
        };
    }
};
exports.DiseaseService = DiseaseService;
exports.DiseaseService = DiseaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(disease_event_entity_1.DiseaseEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(disease_prediction_entity_1.DiseasePrediction)),
    __param(2, (0, typeorm_1.InjectRepository)(farm_entity_1.Farm)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        weather_service_1.WeatherService,
        pomegranate_fruit_pipeline_service_1.PomegranateFruitPipelineService,
        gallery_service_1.GalleryService])
], DiseaseService);
//# sourceMappingURL=disease.service.js.map