import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expense/expense.entity';
import { DailyActivity } from '../daily-activity/daily-activity.entity';
import { DiseaseEvent } from '../disease/disease-event.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(DailyActivity)
    private dailyActivityRepository: Repository<DailyActivity>,
    @InjectRepository(DiseaseEvent)
    private diseaseRepository: Repository<DiseaseEvent>,
  ) {}

  async getDashboardData(userId: number) {
    // Fetch user's recorded expenses from DB
    const expenses = await this.expenseRepository.find({
      where: { user: { id: userId } },
    });

    // Fetch user's recorded daily activities from DB
    const activities = await this.dailyActivityRepository.find({
      where: { user: { id: userId } },
      relations: { farm: true },
      order: { date: 'DESC', id: 'DESC' },
      take: 5,
    });

    // Fetch user's logged crop disease alerts from DB
    const diseaseEvents = await this.diseaseRepository.find({
      where: { user: { id: userId } },
      relations: { farm: true },
      order: { detectedAt: 'DESC' },
    });

    const currentYear = 2026;
    const currentMonthIdx = 6; // July

    // Calculate sum of July 2026 expenses
    const julyExpenses = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate sum of June 2026 expenses
    const juneExpensesInDb = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === 5;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Group actual DB expenses by month for 2026
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

    // Mock baseline values for historical months (Jan - Jun)
    const baseExpenses = [3100, 2900, 4200, 3800, 4900, 5300, 0];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

    // Construct the live Expense Trend chart data
    const expenseTrend = months.map((m, idx) => {
      const value = m === 'Jul' ? monthlySum[m] : baseExpenses[idx] + monthlySum[m];
      return { month: m, value: Math.round(value) };
    });

    // Calculate comparison delta vs June
    const juneTotal = baseExpenses[5] + juneExpensesInDb;
    const change = juneTotal > 0 ? ((julyExpenses - juneTotal) / juneTotal) * 100 : 0;

    // Convert daily activities to dashboard recent activities format
    const parsedActivities = activities.map(act => {
      let type = 'weather';
      const typeLower = act.activityType.toLowerCase();
      if (typeLower.includes('irrigation') || typeLower.includes('water')) {
        type = 'irrigation';
      } else if (typeLower.includes('pest') || typeLower.includes('spray') || typeLower.includes('treatment')) {
        type = 'treatment';
      } else if (typeLower.includes('fertil')) {
        type = 'expense';
      } else if (typeLower.includes('harvest')) {
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

    // Fallback baseline activities
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

    // Merge real database activities with system alerts
    const recentActivities = [...parsedActivities, ...baselineActivities].slice(0, 5);

    // Convert disease database events to alerts format
    const activeAlerts = diseaseEvents.map(event => {
      // High severity if Temp > 30C or Humidity > 80% (favorable conditions for rapid growth)
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

    // Fallback alerts if empty
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
}
