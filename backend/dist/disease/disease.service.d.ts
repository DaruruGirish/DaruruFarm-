import { Repository } from 'typeorm';
import { DiseaseEvent } from './disease-event.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
export declare class DiseaseService {
    private diseaseRepository;
    private farmRepository;
    constructor(diseaseRepository: Repository<DiseaseEvent>, farmRepository: Repository<Farm>);
    create(filename: string, diseaseName: string, temp: number, humidity: number, rainfall: number, farmId: number, user: User): Promise<DiseaseEvent>;
    findAll(user: User): Promise<DiseaseEvent[]>;
    findOne(id: number, user: User): Promise<DiseaseEvent>;
    remove(id: number, user: User): Promise<void>;
    predictDiseaseRisk(data: {
        rainfall_mm: number;
        humidity: number;
        temperature: number;
        recent_disease_count?: number;
        recent_high_severity_count?: number;
        irrigation_liters?: number;
        pesticide_spray_count?: number;
        disease_log_count?: number;
        pest_inspection_count?: number;
    }): Promise<{
        risk_percentage: number;
        risk_level: string;
        recommendation: any;
        features: {
            rainfall_mm: number;
            humidity: number;
            temperature: number;
            recent_disease_count: number;
            recent_high_severity_count: number;
            irrigation_liters: number;
            pesticide_spray_count: number;
            disease_log_count: number;
            pest_inspection_count: number;
        };
    }>;
}
