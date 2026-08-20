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
exports.CreateActivityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateActivityDto {
    date;
    activityType;
    notes;
    farmId;
    pesticideName;
    pesticideQuantity;
    pesticideTime;
    waterHours;
}
exports.CreateActivityDto = CreateActivityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-27', description: 'Date of the activity (YYYY-MM-DD)' }),
    __metadata("design:type", Date)
], CreateActivityDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Irrigation', description: 'Type of activity (e.g. Irrigation, Fertilization, Harvesting)' }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "activityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Watered north-west orange sector for 30 minutes', description: 'Activity details / notes' }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID of the associated farm' }),
    __metadata("design:type", Number)
], CreateActivityDto.prototype, "farmId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Glyphosate', required: false }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "pesticideName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10 Liters', required: false }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "pesticideQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '08:30 AM', required: false }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "pesticideTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4.5, required: false, description: 'Hours of water supplied (Water Supply logs)' }),
    __metadata("design:type", Number)
], CreateActivityDto.prototype, "waterHours", void 0);
//# sourceMappingURL=create-activity.dto.js.map