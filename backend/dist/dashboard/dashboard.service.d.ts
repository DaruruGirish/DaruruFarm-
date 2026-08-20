import { Repository } from 'typeorm';
import { Expense } from '../expense/expense.entity';
import { DailyActivity } from '../daily-activity/daily-activity.entity';
import { DiseaseEvent } from '../disease/disease-event.entity';
import { Farm } from '../farm/farm.entity';
import { WeatherService } from '../weather/weather.service';
export declare class DashboardService {
    private expenseRepository;
    private dailyActivityRepository;
    private diseaseRepository;
    private farmRepository;
    private weatherService;
    constructor(expenseRepository: Repository<Expense>, dailyActivityRepository: Repository<DailyActivity>, diseaseRepository: Repository<DiseaseEvent>, farmRepository: Repository<Farm>, weatherService: WeatherService);
    getDashboardData(userId: number, farmId?: number, role?: string): Promise<{
        weather: any;
        metrics: {
            expenses: {
                value: number;
                previous: number;
                change: number;
            } | null;
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
        }[];
        recentActivities: {
            id: number;
            type: string;
            description: string;
            user: string;
            time: string;
        }[];
        charts: {
            expenseTrend: {
                month: string;
                value: number;
            }[];
            rainfallHumidity: any[];
            windTemperature: any[];
        };
    }>;
}
