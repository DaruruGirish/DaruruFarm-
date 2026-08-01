import { Repository } from 'typeorm';
import { Expense } from '../expense/expense.entity';
import { DailyActivity } from '../daily-activity/daily-activity.entity';
import { DiseaseEvent } from '../disease/disease-event.entity';
export declare class DashboardService {
    private expenseRepository;
    private dailyActivityRepository;
    private diseaseRepository;
    constructor(expenseRepository: Repository<Expense>, dailyActivityRepository: Repository<DailyActivity>, diseaseRepository: Repository<DiseaseEvent>);
    getDashboardData(userId: number): Promise<{
        weather: {
            temp: number;
            condition: string;
            humidity: number;
            wind: number;
            location: string;
        };
        metrics: {
            expenses: {
                value: number;
                previous: number;
                change: number;
            };
            harvest: {
                value: number;
                previous: number;
                change: number;
            };
            employees: {
                value: number;
                previous: number;
                change: number;
            };
            alertsCount: number;
        };
        alerts: {
            id: number;
            severity: string;
            crop: string;
            disease: string;
            location: string;
            date: string;
            filename: string;
            temp: number;
            humidity: number;
            rainfall: number;
        }[] | {
            id: string;
            severity: string;
            crop: string;
            disease: string;
            location: string;
            date: string;
            temp: number;
            humidity: number;
            rainfall: number;
        }[];
        recentActivities: ({
            id: number;
            type: string;
            description: string;
            user: string;
            time: string;
        } | {
            id: string;
            type: string;
            description: string;
            user: string;
            time: string;
        })[];
        charts: {
            expenseTrend: {
                month: string;
                value: number;
            }[];
            harvestTrend: {
                month: string;
                value: number;
            }[];
            waterUsageRainfall: {
                month: string;
                water: number;
                rain: number;
            }[];
        };
    }>;
}
