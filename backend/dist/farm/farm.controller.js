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
exports.FarmController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const farm_service_1 = require("./farm.service");
const create_farm_dto_1 = require("./dto/create-farm.dto");
const update_farm_dto_1 = require("./dto/update-farm.dto");
let FarmController = class FarmController {
    farmService;
    constructor(farmService) {
        this.farmService = farmService;
    }
    create(createFarmDto, req) {
        const user = { id: req.user.id };
        return this.farmService.create(createFarmDto, user);
    }
    findAll(req) {
        const user = { id: req.user.id };
        return this.farmService.findAll(user);
    }
    findOne(id, req) {
        const user = { id: req.user.id };
        return this.farmService.findOne(+id, user);
    }
    update(id, updateFarmDto, req) {
        const user = { id: req.user.id };
        return this.farmService.update(+id, updateFarmDto, user);
    }
    remove(id, req) {
        const user = { id: req.user.id };
        return this.farmService.remove(+id, user);
    }
};
exports.FarmController = FarmController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new farm' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Farm created successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_farm_dto_1.CreateFarmDto, Object]),
    __metadata("design:returntype", void 0)
], FarmController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all farms for the logged-in user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of farms retrieved successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FarmController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific farm' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Farm details retrieved.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Farm not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FarmController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing farm' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Farm updated successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Farm not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_farm_dto_1.UpdateFarmDto, Object]),
    __metadata("design:returntype", void 0)
], FarmController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a farm' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Farm deleted successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Farm not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FarmController.prototype, "remove", null);
exports.FarmController = FarmController = __decorate([
    (0, swagger_1.ApiTags)('Farms'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('farms'),
    __metadata("design:paramtypes", [farm_service_1.FarmService])
], FarmController);
//# sourceMappingURL=farm.controller.js.map