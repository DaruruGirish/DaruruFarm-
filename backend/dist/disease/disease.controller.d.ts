import { DiseaseService } from './disease.service';
export declare class DiseaseController {
    private readonly diseaseService;
    constructor(diseaseService: DiseaseService);
    uploadFile(file: any, diseaseName: string, temp: string, humidity: string, rainfall: string, farmId: string, req: any): Promise<import("./disease-event.entity").DiseaseEvent>;
    findAll(req: any): Promise<import("./disease-event.entity").DiseaseEvent[]>;
    remove(id: string, req: any): Promise<void>;
}
