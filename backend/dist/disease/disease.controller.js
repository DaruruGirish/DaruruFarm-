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
let DiseaseController = class DiseaseController {
    diseaseService;
    constructor(diseaseService) {
        this.diseaseService = diseaseService;
    }
    uploadFile(file, diseaseName, temp, humidity, rainfall, farmId, req) {
        if (!file) {
            throw new common_1.BadRequestException('Disease image is required');
        }
        if (!diseaseName || !temp || !humidity || !farmId) {
            throw new common_1.BadRequestException('Disease name, temperature, humidity, and farm ID are required');
        }
        const user = { id: req.user.id };
        return this.diseaseService.create(file.filename, diseaseName, parseFloat(temp), parseInt(humidity), rainfall ? parseFloat(rainfall) : 0, parseInt(farmId), user);
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
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Log a new crop disease incident with image and weather parameters' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
                diseaseName: { type: 'string' },
                temp: { type: 'number' },
                humidity: { type: 'number' },
                rainfall: { type: 'number' },
                farmId: { type: 'string' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Disease incident logged successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file format.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `disease-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new common_1.BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
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
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of crop diseases retrieved.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DiseaseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a crop disease incident' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Incident deleted successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Incident not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
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