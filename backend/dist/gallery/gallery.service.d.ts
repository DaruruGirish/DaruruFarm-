import { Repository } from 'typeorm';
import { GalleryImage } from './gallery-image.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
export declare class GalleryService {
    private galleryRepository;
    private farmRepository;
    constructor(galleryRepository: Repository<GalleryImage>, farmRepository: Repository<Farm>);
    create(filename: string, caption: string, farmId: number | undefined, user: User): Promise<GalleryImage>;
    findAll(user: User): Promise<GalleryImage[]>;
    findOne(id: number, user: User): Promise<GalleryImage>;
    remove(id: number, user: User): Promise<void>;
}
