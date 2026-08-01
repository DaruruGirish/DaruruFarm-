import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';
export declare class GalleryImage {
    id: number;
    filename: string;
    caption: string;
    uploadedAt: Date;
    farm: Farm;
    user: User;
}
