import { GalleryService } from './gallery.service';
export declare class GalleryController {
    private readonly galleryService;
    constructor(galleryService: GalleryService);
    uploadFile(file: any, caption: string, farmId: string, req: any): Promise<import("./gallery-image.entity").GalleryImage>;
    findAll(req: any): Promise<import("./gallery-image.entity").GalleryImage[]>;
    remove(id: string, req: any): Promise<void>;
}
