"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyActivityModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const daily_activity_entity_1 = require("./daily-activity.entity");
const farm_entity_1 = require("../farm/farm.entity");
const user_entity_1 = require("../auth/user.entity");
const daily_activity_service_1 = require("./daily-activity.service");
const daily_activity_controller_1 = require("./daily-activity.controller");
let DailyActivityModule = class DailyActivityModule {
};
exports.DailyActivityModule = DailyActivityModule;
exports.DailyActivityModule = DailyActivityModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([daily_activity_entity_1.DailyActivity, farm_entity_1.Farm, user_entity_1.User])],
        controllers: [daily_activity_controller_1.DailyActivityController],
        providers: [daily_activity_service_1.DailyActivityService],
        exports: [daily_activity_service_1.DailyActivityService, typeorm_1.TypeOrmModule],
    })
], DailyActivityModule);
//# sourceMappingURL=daily-activity.module.js.map