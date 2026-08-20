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
exports.UpdateActivityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UpdateActivityDto {
    date;
    activityType;
    notes;
    farmId;
    pesticideName;
    pesticideQuantity;
    pesticideTime;
    waterHours;
}
exports.UpdateActivityDto = UpdateActivityDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-07-27' }),
    __metadata("design:type", Date)
], UpdateActivityDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Irrigation' }),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "activityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Watered north-west orange sector for 30 minutes' }),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateActivityDto.prototype, "farmId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Glyphosate' }),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "pesticideName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10 Liters' }),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "pesticideQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '08:30 AM' }),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "pesticideTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 4.5, description: 'Hours of water supplied (Water Supply logs)' }),
    __metadata("design:type", Number)
], UpdateActivityDto.prototype, "waterHours", void 0);
//# sourceMappingURL=update-activity.dto.js.map