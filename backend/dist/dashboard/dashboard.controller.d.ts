import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardData(req: any, farmId?: string): Promise<{
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
