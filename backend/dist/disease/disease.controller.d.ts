import { DiseaseService } from './disease.service';
export declare class DiseaseController {
    private readonly diseaseService;
    constructor(diseaseService: DiseaseService);
    predictRisk(data: {
        rainfall_mm: number;
        humidity: number;
        temperature: number;
        recent_disease_count?: number;
        recent_high_severity_count?: number;
        irrigation_liters?: number;
        pesticide_spray_count?: number;
        disease_log_count?: number;
        pest_inspection_count?: number;
    }, req: any): Promise<{
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
    findAll(req: any): Promise<import("./disease-event.entity").DiseaseEvent[]>;
    remove(id: string, req: any): Promise<void>;
}
