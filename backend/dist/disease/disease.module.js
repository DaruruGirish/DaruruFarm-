"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const disease_event_entity_1 = require("./disease-event.entity");
const disease_prediction_entity_1 = require("./disease-prediction.entity");
const farm_entity_1 = require("../farm/farm.entity");
const user_entity_1 = require("../auth/user.entity");
const disease_service_1 = require("./disease.service");
const disease_controller_1 = require("./disease.controller");
const pomegranate_fruit_pipeline_service_1 = require("./pomegranate-fruit-pipeline.service");
const weather_module_1 = require("../weather/weather.module");
const gallery_module_1 = require("../gallery/gallery.module");
let DiseaseModule = class DiseaseModule {
};
exports.DiseaseModule = DiseaseModule;
exports.DiseaseModule = DiseaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([disease_event_entity_1.DiseaseEvent, disease_prediction_entity_1.DiseasePrediction, farm_entity_1.Farm, user_entity_1.User]),
            weather_module_1.WeatherModule,
            gallery_module_1.GalleryModule,
        ],
        controllers: [disease_controller_1.DiseaseController],
        providers: [disease_service_1.DiseaseService, pomegranate_fruit_pipeline_service_1.PomegranateFruitPipelineService],
        exports: [disease_service_1.DiseaseService, typeorm_1.TypeOrmModule],
    })
], DiseaseModule);
//# sourceMappingURL=disease.module.js.map