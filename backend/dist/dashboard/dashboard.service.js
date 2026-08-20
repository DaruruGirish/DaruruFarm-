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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expense_entity_1 = require("../expense/expense.entity");
const daily_activity_entity_1 = require("../daily-activity/daily-activity.entity");
const disease_event_entity_1 = require("../disease/disease-event.entity");
const farm_entity_1 = require("../farm/farm.entity");
const weather_service_1 = require("../weather/weather.service");
let DashboardService = class DashboardService {
    expenseRepository;
    dailyActivityRepository;
    diseaseRepository;
    farmRepository;
    weatherService;
    constructor(expenseRepository, dailyActivityRepository, diseaseRepository, farmRepository, weatherService) {
        this.expenseRepository = expenseRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.diseaseRepository = diseaseRepository;
        this.farmRepository = farmRepository;
        this.weatherService = weatherService;
    }
    async getDashboardData(userId, farmId, role) {
        const hideExpenses = role === 'viewer';
        let monthExpenses = 0;
        let previousMonthExpenses = 0;
        let change = 0;
        let expenseTrend = [];
        if (!hideExpenses) {
            const expenses = await this.expenseRepository.find({
                where: { user: { id: userId } },
            });
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonthIdx = now.getMonth();
            monthExpenses = expenses
                .filter((e) => {
                const d = new Date(e.date);
                return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
            })
                .reduce((sum, e) => sum + Number(e.amount), 0);
            const previousMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
            const previousMonthYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
            previousMonthExpenses = expenses
                .filter((e) => {
                const d = new Date(e.date);
                return d.getFullYear() === previousMonthYear && d.getMonth() === previousMonthIdx;
            })
                .reduce((sum, e) => sum + Number(e.amount), 0);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlySum = {};
            monthNames.forEach((m) => {
                monthlySum[m] = 0;
            });
            expenses.forEach((e) => {
                const d = new Date(e.date);
                if (d.getFullYear() === currentYear) {
                    const m = monthNames[d.getMonth()];
                    monthlySum[m] += Number(e.amount);
                }
            });
            expenseTrend = monthNames.slice(0, currentMonthIdx + 1).map((m) => ({
                month: m,
                value: Math.round(monthlySum[m] || 0),
            }));
            change =
                previousMonthExpenses > 0 ? ((monthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 : 0;
        }
        const activities = await this.dailyActivityRepository.find({
            where: { user: { id: userId } },
            relations: { farm: true },
            order: { date: 'DESC', id: 'DESC' },
            take: 5,
        });
        const diseaseEvents = await this.diseaseRepository.find({
            where: { user: { id: userId } },
            relations: { farm: true },
            order: { detectedAt: 'DESC' },
        });
        const parsedActivities = activities.map((act) => {
            let type = 'weather';
            const typeLower = act.activityType.toLowerCase();
            if (typeLower.includes('irrigation') || typeLower.includes('water')) {
                type = 'irrigation';
            }
            else if (typeLower.includes('pest') || typeLower.includes('spray') || typeLower.includes('treatment')) {
                type = 'treatment';
            }
            else if (typeLower.includes('fertil')) {
                type = 'expense';
            }
            else if (typeLower.includes('harvest')) {
                type = 'employee';
            }
            return {
                id: act.id,
                type,
                description: `${act.activityType} on ${act.farm?.name || 'Farm'}: ${act.notes}`,
                user: 'You',
                time: new Date(act.date).toLocaleDateString(),
            };
        });
        const activeAlerts = diseaseEvents.map((event) => {
            const severity = event.temp > 30 || event.humidity > 80 ? 'high' : 'medium';
            return {
                id: event.id,
                severity,
                crop: event.farm?.cropVariety || 'Crops',
                disease: event.diseaseName,
                location: event.farm?.name || 'Holdings',
                date: event.detectedAt.toISOString().split('T')[0],
                filename: event.filename,
                temp: Number(event.temp),
                humidity: event.humidity,
                rainfall: Number(event.rainfall),
            };
        });
        const farms = await this.farmRepository.find({
            where: { user: { id: userId } },
            order: { id: 'ASC' },
        });
        const selectedFarm = farmId != null
            ? farms.find((farm) => farm.id === farmId) || farms[0]
            : farms.find((farm) => farm.latitude != null && farm.longitude != null) || farms[0];
        let weather = {
            temp: null,
            condition: 'Set farm location',
            humidity: null,
            rainfall: null,
            wind: null,
            location: selectedFarm?.locationLabel || selectedFarm?.address || selectedFarm?.name || 'Set farm location',
            latitude: selectedFarm?.latitude != null ? Number(selectedFarm.latitude) : null,
            longitude: selectedFarm?.longitude != null ? Number(selectedFarm.longitude) : null,
            forecast: [],
        };
        let rainfallHumidity = [];
        let windTemperature = [];
        try {
            const live = await this.weatherService.getDashboardWeather(selectedFarm || null);
            if (live) {
                weather = live;
                rainfallHumidity = live.rainfallHumidity || [];
                windTemperature = live.windTemperature || [];
            }
        }
        catch {
        }
        return {
            weather,
            metrics: {
                expenses: hideExpenses
                    ? null
                    : {
                        value: Math.round(monthExpenses),
                        previous: Math.round(previousMonthExpenses),
                        change: parseFloat(change.toFixed(1)),
                    },
                alertsCount: diseaseEvents.length,
            },
            alerts: activeAlerts,
            recentActivities: parsedActivities.slice(0, 5),
            charts: {
                expenseTrend: hideExpenses ? [] : expenseTrend,
                rainfallHumidity,
                windTemperature,
            },
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expense_entity_1.Expense)),
    __param(1, (0, typeorm_1.InjectRepository)(daily_activity_entity_1.DailyActivity)),
    __param(2, (0, typeorm_1.InjectRepository)(disease_event_entity_1.DiseaseEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(farm_entity_1.Farm)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        weather_service_1.WeatherService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map