import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';
export declare class DailyActivity {
    id: number;
    date: Date;
    activityType: string;
    notes: string;
    pesticideName: string;
    pesticideQuantity: string;
    pesticideTime: string;
    farm: Farm;
    user: User;
}
