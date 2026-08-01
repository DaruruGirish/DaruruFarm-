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
exports.DailyActivityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const daily_activity_entity_1 = require("./daily-activity.entity");
const farm_entity_1 = require("../farm/farm.entity");
let DailyActivityService = class DailyActivityService {
    dailyActivityRepository;
    farmRepository;
    constructor(dailyActivityRepository, farmRepository) {
        this.dailyActivityRepository = dailyActivityRepository;
        this.farmRepository = farmRepository;
    }
    async create(createActivityDto, user) {
        const farm = await this.farmRepository.findOne({
            where: { id: createActivityDto.farmId, user: { id: user.id } },
        });
        if (!farm) {
            throw new common_1.NotFoundException(`Farm with ID ${createActivityDto.farmId} not found or unauthorized`);
        }
        const dailyActivity = this.dailyActivityRepository.create({
            date: createActivityDto.date,
            activityType: createActivityDto.activityType,
            notes: createActivityDto.notes,
            pesticideName: createActivityDto.pesticideName,
            pesticideQuantity: createActivityDto.pesticideQuantity,
            pesticideTime: createActivityDto.pesticideTime,
            farm,
            user,
        });
        return this.dailyActivityRepository.save(dailyActivity);
    }
    async findAll(user) {
        return this.dailyActivityRepository.find({
            where: { user: { id: user.id } },
            relations: { farm: true },
            order: { date: 'DESC', id: 'DESC' },
        });
    }
    async findOne(id, user) {
        const activity = await this.dailyActivityRepository.findOne({
            where: { id, user: { id: user.id } },
            relations: { farm: true },
        });
        if (!activity) {
            throw new common_1.NotFoundException(`Activity log with ID ${id} not found`);
        }
        return activity;
    }
    async update(id, updateActivityDto, user) {
        const activity = await this.findOne(id, user);
        if (updateActivityDto.farmId !== undefined) {
            const farm = await this.farmRepository.findOne({
                where: { id: updateActivityDto.farmId, user: { id: user.id } },
            });
            if (!farm) {
                throw new common_1.NotFoundException(`Farm with ID ${updateActivityDto.farmId} not found or unauthorized`);
            }
            activity.farm = farm;
        }
        if (updateActivityDto.date !== undefined) {
            activity.date = updateActivityDto.date;
        }
        if (updateActivityDto.activityType !== undefined) {
            activity.activityType = updateActivityDto.activityType;
        }
        if (updateActivityDto.notes !== undefined) {
            activity.notes = updateActivityDto.notes;
        }
        if (updateActivityDto.pesticideName !== undefined) {
            activity.pesticideName = updateActivityDto.pesticideName;
        }
        if (updateActivityDto.pesticideQuantity !== undefined) {
            activity.pesticideQuantity = updateActivityDto.pesticideQuantity;
        }
        if (updateActivityDto.pesticideTime !== undefined) {
            activity.pesticideTime = updateActivityDto.pesticideTime;
        }
        return this.dailyActivityRepository.save(activity);
    }
    async remove(id, user) {
        const activity = await this.findOne(id, user);
        await this.dailyActivityRepository.remove(activity);
    }
};
exports.DailyActivityService = DailyActivityService;
exports.DailyActivityService = DailyActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(daily_activity_entity_1.DailyActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(farm_entity_1.Farm)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DailyActivityService);
//# sourceMappingURL=daily-activity.service.js.map