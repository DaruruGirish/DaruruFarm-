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
let FarmService = class FarmService {
    farmRepository;
    constructor(farmRepository) {
        this.farmRepository = farmRepository;
    }
    async create(createFarmDto, user) {
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
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FarmService);
//# sourceMappingURL=farm.service.js.map