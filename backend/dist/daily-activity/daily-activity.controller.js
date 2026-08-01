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
exports.DailyActivityController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const daily_activity_service_1 = require("./daily-activity.service");
const create_activity_dto_1 = require("./dto/create-activity.dto");
const update_activity_dto_1 = require("./dto/update-activity.dto");
let DailyActivityController = class DailyActivityController {
    dailyActivityService;
    constructor(dailyActivityService) {
        this.dailyActivityService = dailyActivityService;
    }
    create(createActivityDto, req) {
        const user = { id: req.user.id };
        return this.dailyActivityService.create(createActivityDto, user);
    }
    findAll(req) {
        const user = { id: req.user.id };
        return this.dailyActivityService.findAll(user);
    }
    findOne(id, req) {
        const user = { id: req.user.id };
        return this.dailyActivityService.findOne(+id, user);
    }
    update(id, updateActivityDto, req) {
        const user = { id: req.user.id };
        return this.dailyActivityService.update(+id, updateActivityDto, user);
    }
    remove(id, req) {
        const user = { id: req.user.id };
        return this.dailyActivityService.remove(+id, user);
    }
};
exports.DailyActivityController = DailyActivityController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Log a new daily activity' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Activity logged successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_activity_dto_1.CreateActivityDto, Object]),
    __metadata("design:returntype", void 0)
], DailyActivityController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all logged activities for the user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of activity logs retrieved.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DailyActivityController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific activity log' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity log details retrieved.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Activity log not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DailyActivityController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing activity log' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity log updated.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Activity log not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_activity_dto_1.UpdateActivityDto, Object]),
    __metadata("design:returntype", void 0)
], DailyActivityController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an activity log' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity log deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Activity log not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DailyActivityController.prototype, "remove", null);
exports.DailyActivityController = DailyActivityController = __decorate([
    (0, swagger_1.ApiTags)('Daily Activities'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('daily-activities'),
    __metadata("design:paramtypes", [daily_activity_service_1.DailyActivityService])
], DailyActivityController);
//# sourceMappingURL=daily-activity.controller.js.map