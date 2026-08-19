import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expense/expense.entity';
import { DailyActivity } from '../daily-activity/daily-activity.entity';
import { DiseaseEvent } from '../disease/disease-event.entity';
import { Farm } from '../farm/farm.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(DailyActivity)
    private dailyActivityRepository: Repository<DailyActivity>,
    @InjectRepository(DiseaseEvent)
    private diseaseRepository: Repository<DiseaseEvent>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
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

    // Seasonal farm spend (not a straight climb): quiet months vs fertilizer/spray peaks
    const baseExpenses = [68400, 31200, 142500, 52800, 168900, 81500, 0];
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

    const farms = await this.farmRepository.find({
      where: { user: { id: userId } },
      order: { id: 'ASC' },
    });
    const locatedFarm = farms.find((farm) => farm.latitude != null && farm.longitude != null) || farms[0];
    const weatherLatitude = locatedFarm?.latitude != null ? Number(locatedFarm.latitude) : null;
    const weatherLongitude = locatedFarm?.longitude != null ? Number(locatedFarm.longitude) : null;

    return {
      weather: {
        temp: 26,
        condition: 'Light Rain',
        humidity: 78,
        wind: 15,
        location: locatedFarm?.locationLabel || locatedFarm?.address || locatedFarm?.name || 'Set farm location',
        latitude: weatherLatitude,
        longitude: weatherLongitude,
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
        rainfallHumidity: this.buildJulyRainfallHumidity(diseaseEvents),
        windTemperature: this.buildJulyWindTemperature(diseaseEvents),
      },
      labReports: this.buildLabReports(),
    };
  }

  private buildJulyRainfallHumidity(diseaseEvents: DiseaseEvent[]) {
    const rainfallByDay: Record<number, number> = {};
    const humidityByDay: Record<number, number> = {};

    for (const event of diseaseEvents) {
      const d = new Date(event.detectedAt);
      if (d.getFullYear() === 2026 && d.getMonth() === 6) {
        const day = d.getDate();
        rainfallByDay[day] = Number(event.rainfall) || 0;
        humidityByDay[day] = Number(event.humidity) || 0;
      }
    }

    // Monsoon baseline for July, with heavier rain on log days 16 and 26
    const rainBase = [
      8, 12, 6, 4, 10, 18, 22, 16, 9, 14,
      20, 35, 28, 15, 42, 78, 55, 30, 18, 25,
      12, 8, 14, 20, 38, 72, 40, 16, 10, 8,
    ];
    const humidityBase = [
      68, 70, 66, 65, 72, 75, 78, 74, 71, 76,
      80, 84, 82, 77, 86, 92, 90, 85, 79, 81,
      76, 73, 75, 78, 84, 91, 87, 80, 76, 74,
    ];

    return rainBase.map((rain, idx) => {
      const day = idx + 1;
      return {
        day: `Jul ${day}`,
        rainfall: rainfallByDay[day] ?? rain,
        humidity: humidityByDay[day] ?? humidityBase[idx],
      };
    });
  }

  private buildJulyWindTemperature(diseaseEvents: DiseaseEvent[]) {
    const tempByDay: Record<number, number> = {};

    for (const event of diseaseEvents) {
      const d = new Date(event.detectedAt);
      if (d.getFullYear() === 2026 && d.getMonth() === 6) {
        tempByDay[d.getDate()] = Number(event.temp) || 0;
      }
    }

    const windBase = [
      8, 10, 9, 7, 12, 16, 18, 14, 11, 13,
      17, 22, 19, 12, 24, 28, 21, 15, 13, 16,
      11, 9, 12, 15, 20, 26, 18, 12, 10, 9,
    ];
    const tempBase = [
      27, 28, 29, 30, 28, 26, 25, 26, 27, 26,
      25, 24, 24, 26, 23, 22, 23, 25, 26, 25,
      27, 28, 27, 26, 24, 22, 23, 25, 26, 27,
    ];

    return windBase.map((wind, idx) => {
      const day = idx + 1;
      return {
        day: `Jul ${day}`,
        wind,
        temp: tempByDay[day] || tempBase[idx],
      };
    });
  }

  private buildLabReports() {
    return [
      {
        id: 'soil-0704',
        category: 'soil',
        title: 'Soil fertility & moisture panel',
        date: '2026-07-04',
        location: 'Root zone, all holdings',
        status: 'Watch',
        summary: 'Organic fertilizer applied. Moisture adequate; nitrogen slightly below target in compacted pockets.',
        metrics: [
          { label: 'Soil pH', value: '6.5', range: '6.0–7.0' },
          { label: 'Moisture', value: '28%', range: '25–35%' },
          { label: 'EC', value: '0.92 dS/m', range: '< 1.2' },
          { label: 'Organic C', value: '0.68%', range: '> 0.50%' },
        ],
      },
      {
        id: 'ph-0704',
        category: 'ph',
        title: 'Soil pH mapping',
        date: '2026-07-04',
        location: 'North and south plant rows',
        status: 'Optimal',
        summary: 'pH within mango/apple orchard band after organic manure. No lime required this cycle.',
        metrics: [
          { label: 'Mean pH', value: '6.5', range: '6.0–7.0' },
          { label: 'Min pH', value: '6.2', range: '> 5.8' },
          { label: 'Max pH', value: '6.8', range: '< 7.2' },
        ],
      },
      {
        id: 'soil-0712',
        category: 'soil',
        title: 'Post-fertilizer soil report',
        date: '2026-07-12',
        location: 'Fertilizer application bands',
        status: 'Optimal',
        summary: 'Even fertilizer distribution. Nutrient availability improved in the top 20 cm.',
        metrics: [
          { label: 'Soil pH', value: '6.4', range: '6.0–7.0' },
          { label: 'Available N', value: '268 kg/ha', range: '250–350' },
          { label: 'Available P', value: '22 kg/ha', range: '20–40' },
          { label: 'Available K', value: '198 kg/ha', range: '180–250' },
        ],
      },
      {
        id: 'soil-0719',
        category: 'soil',
        title: 'Soil moisture & debris-row survey',
        date: '2026-07-19',
        location: 'Major field rows',
        status: 'Watch',
        summary: 'Moisture good after weeding. Low-lying rows slightly wetter; monitor for fungal pressure.',
        metrics: [
          { label: 'Soil pH', value: '6.3', range: '6.0–7.0' },
          { label: 'Moisture', value: '33%', range: '25–35%' },
          { label: 'Bulk density', value: '1.32 g/cm³', range: '< 1.40' },
        ],
      },
      {
        id: 'ph-0727',
        category: 'ph',
        title: 'Post-rain soil & leaf-zone pH',
        date: '2026-07-27',
        location: 'Plants with minor fungal spots',
        status: 'Watch',
        summary: 'Rain slightly acidified surface soil. Fungicide applied; retest pH after drainage improves.',
        metrics: [
          { label: 'Surface pH', value: '6.1', range: '6.0–7.0' },
          { label: '15 cm pH', value: '6.4', range: '6.0–7.0' },
          { label: 'Irrigation pH', value: '6.9', range: '6.5–7.5' },
        ],
      },
    ];
  }
}
