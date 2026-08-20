import { DiseaseService } from './disease.service';
export declare class DiseaseController {
    private readonly diseaseService;
    constructor(diseaseService: DiseaseService);
    findPredictions(req: any): Promise<import("./disease-prediction.entity").DiseasePrediction[]>;
    predictBacterialBlight(farmId: string, req: any): Promise<{
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
    analyzeFruit(file: any, farmId: string, req: any): Promise<{
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
    analyzeGallery(id: string, req: any): Promise<{
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
    uploadFile(file: any, diseaseName: string, temp: string, humidity: string, rainfall: string, farmId: string, req: any): Promise<import("./disease-event.entity").DiseaseEvent>;
    findAll(req: any): Promise<import("./disease-event.entity").DiseaseEvent[]>;
    remove(id: string, req: any): Promise<void>;
}
