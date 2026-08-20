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
exports.CreateFarmDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateFarmDto {
    name;
    address;
    locationLabel;
    latitude;
    longitude;
    totalAcres;
    numberOfTrees;
    cropVariety;
    cropSeasonStartTime;
}
exports.CreateFarmDto = CreateFarmDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sunshine Orchards', description: 'Name of the farm' }),
    __metadata("design:type", String)
], CreateFarmDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123 Valley Road, California', description: 'Address of the farm' }),
    __metadata("design:type", String)
], CreateFarmDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mysuru, Karnataka', required: false, description: 'Place name used for weather and location APIs' }),
    __metadata("design:type", String)
], CreateFarmDto.prototype, "locationLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12.2958, description: 'Farm latitude' }),
    __metadata("design:type", Number)
], CreateFarmDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 76.6394, description: 'Farm longitude' }),
    __metadata("design:type", Number)
], CreateFarmDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45.5, description: 'Total acres of the farm' }),
    __metadata("design:type", Number)
], CreateFarmDto.prototype, "totalAcres", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1200, description: 'Number of trees on the farm' }),
    __metadata("design:type", Number)
], CreateFarmDto.prototype, "numberOfTrees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Honeycrisp Apples', description: 'Crop variety' }),
    __metadata("design:type", String)
], CreateFarmDto.prototype, "cropVariety", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-01T08:00:00.000Z', description: 'Crop season start time' }),
    __metadata("design:type", Date)
], CreateFarmDto.prototype, "cropSeasonStartTime", void 0);
//# sourceMappingURL=create-farm.dto.js.map