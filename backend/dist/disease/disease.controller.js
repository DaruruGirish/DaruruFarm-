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
const swagger_1 = require("@nestjs/swagger");
const disease_service_1 = require("./disease.service");
let DiseaseController = class DiseaseController {
    diseaseService;
    constructor(diseaseService) {
        this.diseaseService = diseaseService;
    }
    async predictRisk(data, req) {
        const user = { id: req.user.id };
        return this.diseaseService.predictDiseaseRisk(data);
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
    (0, common_1.Post)('predict'),
    (0, swagger_1.ApiOperation)({ summary: 'Predict disease risk based on telemetry data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Risk prediction result' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DiseaseController.prototype, "predictRisk", null);
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