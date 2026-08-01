import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';
export declare class DiseaseEvent {
    id: number;
    diseaseName: string;
    temp: number;
    humidity: number;
    rainfall: number;
    filename: string;
    detectedAt: Date;
    farm: Farm;
    user: User;
}
