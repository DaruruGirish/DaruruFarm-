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
let DashboardService = class DashboardService {
    expenseRepository;
    dailyActivityRepository;
    diseaseRepository;
    constructor(expenseRepository, dailyActivityRepository, diseaseRepository) {
        this.expenseRepository = expenseRepository;
        this.dailyActivityRepository = dailyActivityRepository;
        this.diseaseRepository = diseaseRepository;
    }
    async getDashboardData(userId) {
        const expenses = await this.expenseRepository.find({
            where: { user: { id: userId } },
        });
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
        const currentYear = 2026;
        const currentMonthIdx = 6;
        const julyExpenses = expenses
            .filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
        })
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const juneExpensesInDb = expenses
            .filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === currentYear && d.getMonth() === 5;
        })
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const monthlySum = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0 };
        expenses.forEach(e => {
            const d = new Date(e.date);
            if (d.getFullYear() === currentYear) {
                const m = d.toLocaleString('default', { month: 'short' });
                if (monthlySum[m] !== undefined) {
                    monthlySum[m] += Number(e.amount);
                }
            }
        });
        const baseExpenses = [3100, 2900, 4200, 3800, 4900, 5300, 0];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
        const expenseTrend = months.map((m, idx) => {
            const value = m === 'Jul' ? monthlySum[m] : baseExpenses[idx] + monthlySum[m];
            return { month: m, value: Math.round(value) };
        });
        const juneTotal = baseExpenses[5] + juneExpensesInDb;
        const change = juneTotal > 0 ? ((julyExpenses - juneTotal) / juneTotal) * 100 : 0;
        const parsedActivities = activities.map(act => {
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
        const baselineActivities = [
            {
                id: 'mock-1',
                type: 'weather',
                description: 'Heavy rainfall warning issued for tomorrow',
                user: 'System',
                time: '10m ago',
            },
            {
                id: 'mock-2',
                type: 'irrigation',
                description: 'Irrigation cycle completed for West Fields',
                user: 'Auto-pilot',
                time: '1h ago',
            },
            {
                id: 'mock-3',
                type: 'treatment',
                description: 'Pest control spraying completed in sector B',
                user: 'D. Miller',
                time: '3h ago',
            },
        ];
        const recentActivities = [...parsedActivities, ...baselineActivities].slice(0, 5);
        const activeAlerts = diseaseEvents.map(event => {
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
        const fallbackAlerts = [
            {
                id: 'mock-d1',
                severity: 'high',
                crop: 'Apples',
                disease: 'Fire Blight',
                location: 'East Orchard',
                date: '2026-07-26',
                temp: 31,
                humidity: 82,
                rainfall: 12,
            },
            {
                id: 'mock-d2',
                severity: 'medium',
                crop: 'Peaches',
                disease: 'Leaf Curl',
                location: 'North Sector',
                date: '2026-07-27',
                temp: 24,
                humidity: 68,
                rainfall: 4,
            },
        ];
        const alerts = activeAlerts.length > 0 ? activeAlerts : fallbackAlerts;
        return {
            weather: {
                temp: 26,
                condition: 'Light Rain',
                humidity: 78,
                wind: 15,
                location: 'Valley Region',
            },
            metrics: {
                expenses: {
                    value: Math.round(julyExpenses),
                    previous: Math.round(juneTotal),
                    change: parseFloat(change.toFixed(1)),
                },
                harvest: {
                    value: 12.8,
                    previous: 11.5,
                    change: 11.3,
                },
                employees: {
                    value: 16,
                    previous: 15,
                    change: 6.6,
                },
                alertsCount: diseaseEvents.length > 0 ? diseaseEvents.length : fallbackAlerts.length,
            },
            alerts,
            recentActivities,
            charts: {
                expenseTrend,
                harvestTrend: [
                    { month: 'Jan', value: 2.1 },
                    { month: 'Feb', value: 1.8 },
                    { month: 'Mar', value: 3.5 },
                    { month: 'Apr', value: 5.6 },
                    { month: 'May', value: 8.2 },
                    { month: 'Jun', value: 10.4 },
                    { month: 'Jul', value: 12.8 },
                ],
                waterUsageRainfall: [
                    { month: 'Jan', water: 320, rain: 95 },
                    { month: 'Feb', water: 340, rain: 75 },
                    { month: 'Mar', water: 280, rain: 140 },
                    { month: 'Apr', water: 220, rain: 195 },
                    { month: 'May', water: 190, rain: 210 },
                    { month: 'Jun', water: 150, rain: 260 },
                    { month: 'Jul', water: 180, rain: 185 },
                ],
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map