import { User } from '../auth/user.entity';
export declare class Farm {
    id: number;
    name: string;
    address: string;
    totalAcres: number;
    numberOfTrees: number;
    cropVariety: string;
    cropSeasonStartTime: Date;
    user: User;
}
