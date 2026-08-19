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
const farm_entity_1 = require("../farm/farm.entity");
const fs = __importStar(require("fs"));
const path_1 = require("path");
let DiseaseService = class DiseaseService {
    diseaseRepository;
    farmRepository;
    constructor(diseaseRepository, farmRepository) {
        this.diseaseRepository = diseaseRepository;
        this.farmRepository = farmRepository;
    }
    async create(filename, diseaseName, temp, humidity, rainfall, farmId, user) {
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
    async predictDiseaseRisk(data) {
        const rainfall = Number(data.rainfall_mm) || 0;
        const humidity = Number(data.humidity) || 0;
        const temperature = Number(data.temperature) || 0;
        const recent_disease = Number(data.recent_disease_count) || 0;
        const recent_high_severity = Number(data.recent_high_severity_count) || 0;
        const irrigation = Number(data.irrigation_liters) || 2000;
        const sprays = Number(data.pesticide_spray_count) || 0;
        const disease_logs = Number(data.disease_log_count) || 0;
        const pest_inspections = Number(data.pest_inspection_count) || 0;
        let score = 0;
        if (rainfall > 60)
            score += 25;
        else if (rainfall > 30)
            score += 15;
        if (humidity > 80)
            score += 30;
        else if (humidity > 65)
            score += 15;
        if (temperature >= 24 && temperature <= 32)
            score += 20;
        if (recent_disease > 2)
            score += 15;
        else if (recent_disease > 0)
            score += 8;
        if (recent_high_severity > 0)
            score += 15;
        if (sprays === 0)
            score += 10;
        else if (sprays >= 2)
            score -= 15;
        if (disease_logs > 1)
            score += 10;
        const risk_percentage = Math.min(99.4, Math.max(5.2, Math.round((score * 0.85 + (rainfall * 0.15)) * 10) / 10));
        let risk_level = 'LOW';
        if (risk_percentage >= 70) {
            risk_level = 'HIGH';
        }
        else if (risk_percentage >= 40) {
            risk_level = 'MEDIUM';
        }
        const recommendations = {
            HIGH: {
                action: 'Immediate preventive fungicide application recommended (Mancozeb 75 WP @ 2.5g/L or Copper Oxychloride @ 3g/L).',
                irrigation: 'Reduce drip duration and halt overhead sprinklers to lower canopy humidity.',
                protocol: 'Perform immediate field scout across damp sectors and quarantine affected clusters.',
            },
            MEDIUM: {
                action: 'Apply bio-fungicide or organic neem oil spray (3ml/L) as a prophylactic barrier.',
                irrigation: 'Ensure good root zone aeration; schedule irrigation for early morning.',
                protocol: 'Monitor humidity telemetry and inspect leaves daily for fungal spore spots.',
            },
            LOW: {
                action: 'Microclimate is within safe agronomic bounds. Standard nutrition schedule advised.',
                irrigation: 'Normal irrigation schedule based on soil moisture tension telemetry.',
                protocol: 'Continue routine bi-weekly field scouting.',
            },
        };
        return {
            risk_percentage,
            risk_level,
            recommendation: recommendations[risk_level],
            features: {
                rainfall_mm: rainfall,
                humidity,
                temperature,
                recent_disease_count: recent_disease,
                recent_high_severity_count: recent_high_severity,
                irrigation_liters: irrigation,
                pesticide_spray_count: sprays,
                disease_log_count: disease_logs,
                pest_inspection_count: pest_inspections,
            },
        };
    }
};
exports.DiseaseService = DiseaseService;
exports.DiseaseService = DiseaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(disease_event_entity_1.DiseaseEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(farm_entity_1.Farm)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DiseaseService);
//# sourceMappingURL=disease.service.js.map