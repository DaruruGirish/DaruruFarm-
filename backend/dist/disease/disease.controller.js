"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path_1 = require("path");
const disease_service_1 = require("./disease.service");
const imageUpload = (0, platform_express_1.FileInterceptor)('image', {
    storage: (0, multer_1.diskStorage)({
        destination: './uploads',
        filename: (_req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = (0, path_1.extname)(file.originalname);
            callback(null, `disease-${uniqueSuffix}${ext}`);
        },
    }),
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            return callback(new common_1.BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed!'), false);
        }
        callback(null, true);
    },
    limits: {
        fileSize: 8 * 1024 * 1024,
    },
});
let DiseaseController = class DiseaseController {
    diseaseService;
    constructor(diseaseService) {
        this.diseaseService = diseaseService;
    }
    findPredictions(req) {
        const user = { id: req.user.id };
        return this.diseaseService.findPredictions(user);
    }
    predictBacterialBlight(farmId, req) {
        const parsed = parseInt(farmId, 10);
        if (!Number.isFinite(parsed)) {
            throw new common_1.BadRequestException('farmId is required');
        }
        const user = { id: req.user.id };
        return this.diseaseService.predictPomegranateBacterialBlight(parsed, user);
    }
    analyzeFruit(file, farmId, req) {
        if (!file) {
            throw new common_1.BadRequestException('Image file is required');
        }
        const parsedFarmId = farmId ? parseInt(farmId, 10) : NaN;
        const user = { id: req.user.id };
        return this.diseaseService.analyzeFruit(file.filename, Number.isFinite(parsedFarmId) ? parsedFarmId : null, user);
    }
    analyzeGallery(id, req) {
        const parsed = parseInt(id, 10);
        if (!Number.isFinite(parsed)) {
            throw new common_1.BadRequestException('Gallery image id is required');
        }
        const user = { id: req.user.id };
        return this.diseaseService.analyzeGalleryImage(parsed, user);
    }
    uploadFile(file, diseaseName, temp, humidity, rainfall, farmId, req) {
        if (!file) {
            throw new common_1.BadRequestException('Image file is required');
        }
        const user = { id: req.user.id };
        return this.diseaseService.create(file.filename, diseaseName, parseFloat(temp), parseInt(humidity, 10), parseFloat(rainfall), parseInt(farmId, 10), user);
    }
    findAll(req) {
        const user = { id: req.user.id };
        return this.diseaseService.findAll(user);
    }
    remove(id, req) {
        const user = { id: req.user.id };
        return this.diseaseService.remove(+id, user);
    }
};
exports.DiseaseController = DiseaseController;
__decorate([
    (0, common_1.Get)('predictions'),
    (0, swagger_1.ApiOperation)({ summary: 'List saved vision predictions' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "findPredictions", null);
__decorate([
    (0, common_1.Post)('predict'),
    (0, swagger_1.ApiOperation)({ summary: 'Pomegranate bacterial blight risk from live Open-Meteo weather history' }),
    __param(0, (0, common_1.Body)('farmId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "predictBacterialBlight", null);
__decorate([
    (0, common_1.Post)('analyze-fruit'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze a pomegranate fruit photo (DenseNet121 + Grad-CAM++ + HBDS severity)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
                farmId: { type: 'string' },
            },
        },
    }),
    (0, common_1.UseInterceptors)(imageUpload),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('farmId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "analyzeFruit", null);
__decorate([
    (0, common_1.Post)('analyze-gallery/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Run fruit disease AI on an existing gallery photo' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "analyzeGallery", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Log a crop disease incident with photo and weather' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
                diseaseName: { type: 'string' },
                temp: { type: 'string' },
                humidity: { type: 'string' },
                rainfall: { type: 'string' },
                farmId: { type: 'string' },
            },
        },
    }),
    (0, common_1.UseInterceptors)(imageUpload),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('diseaseName')),
    __param(2, (0, common_1.Body)('temp')),
    __param(3, (0, common_1.Body)('humidity')),
    __param(4, (0, common_1.Body)('rainfall')),
    __param(5, (0, common_1.Body)('farmId')),
    __param(6, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all logged crop diseases' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a crop disease incident' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "remove", null);
exports.DiseaseController = DiseaseController = __decorate([
    (0, swagger_1.ApiTags)('Disease Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('disease-management'),
    __metadata("design:paramtypes", [disease_service_1.DiseaseService])
], DiseaseController);
//# sourceMappingURL=disease.controller.js.map