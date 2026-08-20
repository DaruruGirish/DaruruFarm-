"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const viewer_readonly_interceptor_1 = require("./auth/viewer-readonly.interceptor");
const auth_module_1 = require("./auth/auth.module");
const farm_module_1 = require("./farm/farm.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const expense_module_1 = require("./expense/expense.module");
const daily_activity_module_1 = require("./daily-activity/daily-activity.module");
const gallery_module_1 = require("./gallery/gallery.module");
const disease_module_1 = require("./disease/disease.module");
const contact_module_1 = require("./contact/contact.module");
const lab_report_module_1 = require("./lab-report/lab-report.module");
const todo_module_1 = require("./todo/todo.module");
const billing_module_1 = require("./billing/billing.module");
const weather_module_1 = require("./weather/weather.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../.env'],
            }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_DATABASE'),
                    autoLoadEntities: true,
                    synchronize: process.env.TYPEORM_SYNCHRONIZE != null
                        ? process.env.TYPEORM_SYNCHRONIZE === 'true'
                        : process.env.NODE_ENV !== 'production',
                    logging: process.env.TYPEORM_LOGGING === 'true',
                }),
            }),
            auth_module_1.AuthModule,
            farm_module_1.FarmModule,
            dashboard_module_1.DashboardModule,
            expense_module_1.ExpenseModule,
            daily_activity_module_1.DailyActivityModule,
            gallery_module_1.GalleryModule,
            disease_module_1.DiseaseModule,
            contact_module_1.ContactModule,
            lab_report_module_1.LabReportModule,
            todo_module_1.TodoModule,
            billing_module_1.BillingModule,
            weather_module_1.WeatherModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_INTERCEPTOR, useClass: viewer_readonly_interceptor_1.ViewerReadOnlyInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map