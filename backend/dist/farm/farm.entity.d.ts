import { User } from '../auth/user.entity';
export declare class Farm {
    id: number;
    name: string;
    address: string;
    locationLabel: string | null;
    latitude: number | null;
    longitude: number | null;
    totalAcres: number;
    numberOfTrees: number;
    cropVariety: string;
    cropSeasonStartTime: Date;
    user: User;
}
