import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expense/expense.entity';
import { DailyActivity } from '../daily-activity/daily-activity.entity';
import { DiseaseEvent } from '../disease/disease-event.entity';
import { Farm } from '../farm/farm.entity';
import { WeatherService } from '../weather/weather.service';

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
    private weatherService: WeatherService,
  ) {}

  async getDashboardData(userId: number, farmId?: number, role?: string) {
    const hideExpenses = role === 'viewer';
    let monthExpenses = 0;
    let previousMonthExpenses = 0;
    let change = 0;
    let expenseTrend: { month: string; value: number }[] = [];

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
      const monthlySum: Record<string, number> = {};
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

    const parsedActivities = activities.map((act) => {
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
    const selectedFarm =
      farmId != null
        ? farms.find((farm) => farm.id === farmId) || farms[0]
        : farms.find((farm) => farm.latitude != null && farm.longitude != null) || farms[0];

    let weather: any = {
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
    let rainfallHumidity: any[] = [];
    let windTemperature: any[] = [];
    try {
      const live = await this.weatherService.getDashboardWeather(selectedFarm || null);
      if (live) {
        weather = live;
        rainfallHumidity = live.rainfallHumidity || [];
        windTemperature = live.windTemperature || [];
      }
    } catch {
      // Analysis still loads if Open-Meteo is unreachable.
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
}
