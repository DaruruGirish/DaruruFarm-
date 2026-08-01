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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFarmDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UpdateFarmDto {
    name;
    address;
    totalAcres;
    numberOfTrees;
    cropVariety;
    cropSeasonStartTime;
}
exports.UpdateFarmDto = UpdateFarmDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sunshine Orchards' }),
    __metadata("design:type", String)
], UpdateFarmDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123 Valley Road, California' }),
    __metadata("design:type", String)
], UpdateFarmDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 45.5 }),
    __metadata("design:type", Number)
], UpdateFarmDto.prototype, "totalAcres", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1200 }),
    __metadata("design:type", Number)
], UpdateFarmDto.prototype, "numberOfTrees", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Honeycrisp Apples' }),
    __metadata("design:type", String)
], UpdateFarmDto.prototype, "cropVariety", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-01T08:00:00.000Z' }),
    __metadata("design:type", Date)
], UpdateFarmDto.prototype, "cropSeasonStartTime", void 0);
//# sourceMappingURL=update-farm.dto.js.map