"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const gallery_image_entity_1 = require("./gallery-image.entity");
const farm_entity_1 = require("../farm/farm.entity");
const user_entity_1 = require("../auth/user.entity");
const gallery_service_1 = require("./gallery.service");
const gallery_controller_1 = require("./gallery.controller");
let GalleryModule = class GalleryModule {
};
exports.GalleryModule = GalleryModule;
exports.GalleryModule = GalleryModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([gallery_image_entity_1.GalleryImage, farm_entity_1.Farm, user_entity_1.User])],
        controllers: [gallery_controller_1.GalleryController],
        providers: [gallery_service_1.GalleryService],
        exports: [gallery_service_1.GalleryService, typeorm_1.TypeOrmModule],
    })
], GalleryModule);
//# sourceMappingURL=gallery.module.js.map