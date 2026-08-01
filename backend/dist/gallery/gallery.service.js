"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gallery_image_entity_1 = require("./gallery-image.entity");
const farm_entity_1 = require("../farm/farm.entity");
const fs = __importStar(require("fs"));
const path_1 = require("path");
let GalleryService = class GalleryService {
    galleryRepository;
    farmRepository;
    constructor(galleryRepository, farmRepository) {
        this.galleryRepository = galleryRepository;
        this.farmRepository = farmRepository;
    }
    async create(filename, caption, farmId, user) {
        let farm = null;
        if (farmId) {
            farm = await this.farmRepository.findOne({
                where: { id: farmId, user: { id: user.id } },
            });
            if (!farm) {
                throw new common_1.NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
            }
        }
        const image = this.galleryRepository.create({
            filename,
            caption,
            farm: farm || undefined,
            user,
        });
        return this.galleryRepository.save(image);
    }
    async findAll(user) {
        return this.galleryRepository.find({
            where: { user: { id: user.id } },
            relations: { farm: true },
            order: { uploadedAt: 'DESC', id: 'DESC' },
        });
    }
    async findOne(id, user) {
        const image = await this.galleryRepository.findOne({
            where: { id, user: { id: user.id } },
            relations: { farm: true },
        });
        if (!image) {
            throw new common_1.NotFoundException(`Image with ID ${id} not found`);
        }
        return image;
    }
    async remove(id, user) {
        const image = await this.findOne(id, user);
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', image.filename);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (err) {
            console.error(`Failed to delete file from disk: ${filePath}`, err);
        }
        await this.galleryRepository.remove(image);
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gallery_image_entity_1.GalleryImage)),
    __param(1, (0, typeorm_1.InjectRepository)(farm_entity_1.Farm)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map