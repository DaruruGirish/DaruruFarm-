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
exports.FarmService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const farm_entity_1 = require("./farm.entity");
const user_entity_1 = require("../auth/user.entity");
const plan_1 = require("../auth/plan");
let FarmService = class FarmService {
    farmRepository;
    userRepository;
    constructor(farmRepository, userRepository) {
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
    }
    async create(createFarmDto, user) {
        const owner = await this.userRepository.findOne({ where: { id: user.id } });
        const count = await this.farmRepository.count({ where: { user: { id: user.id } } });
        if (count >= 1 && !(0, plan_1.userHasPremium)(owner)) {
            throw new common_1.ForbiddenException('Free plan includes 1 holding. Upgrade to Premium (₹5,000/year) for unlimited holdings.');
        }
        if (createFarmDto.latitude == null || createFarmDto.longitude == null) {
            throw new common_1.BadRequestException('Farm location is required. Search a place or use GPS so we can store latitude and longitude.');
        }
        const farm = this.farmRepository.create({
            ...createFarmDto,
            user,
        });
        return this.farmRepository.save(farm);
    }
    async findAll(user) {
        return this.farmRepository.find({
            where: { user: { id: user.id } },
            order: { id: 'DESC' },
        });
    }
    async findOne(id, user) {
        const farm = await this.farmRepository.findOne({
            where: { id, user: { id: user.id } },
        });
        if (!farm) {
            throw new common_1.NotFoundException(`Farm with ID ${id} not found`);
        }
        return farm;
    }
    async update(id, updateFarmDto, user) {
        const farm = await this.findOne(id, user);
        const updatedFarm = this.farmRepository.merge(farm, updateFarmDto);
        return this.farmRepository.save(updatedFarm);
    }
    async remove(id, user) {
        const farm = await this.findOne(id, user);
        await this.farmRepository.remove(farm);
    }
};
exports.FarmService = FarmService;
exports.FarmService = FarmService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(farm_entity_1.Farm)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FarmService);
//# sourceMappingURL=farm.service.js.map