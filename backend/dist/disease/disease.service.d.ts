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
}
