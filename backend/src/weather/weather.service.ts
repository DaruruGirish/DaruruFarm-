import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from '../farm/farm.entity';
import { WeatherSnapshot } from './weather-snapshot.entity';

const IST = 'Asia/Kolkata';

type Slot = 'morning' | 'evening';

export type WeatherChartPoint = { day: string; rainfall?: number; humidity?: number; wind?: number; temp?: number };
export type WeatherForecastDay = {
  date: string;
  weekday: string;
  tMax: number | null;
  tMin: number | null;
  rain: number | null;
  wind: number | null;
  humidity: number | null;
  condition: string;
};

export type BlightWeatherSeries = {
  currentTemp: number;
  currentHumidity: number;
  rainfall24h: number;
  rainfall72h: number;
  rainyDays7: number;
  avgHumidity3d: number;
  avgTemp3d: number;
  windSpeed: number;
  fetchedAt: string;
};

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectRepository(WeatherSnapshot)
    private snapshots: Repository<WeatherSnapshot>,
    @InjectRepository(Farm)
    private farms: Repository<Farm>,
  ) {}

  async searchPlaces(query: string) {
    const name = (query || '').trim();
    if (name.length < 2) return [];
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=en&format=json`;
    const data = await this.getJson(url);
    return (data.results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      admin1: row.admin1,
      country: row.country,
    }));
  }

  async reverseGeocode(latitude: number, longitude: number) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;
      const data = await this.getJson(url);
      const row = (data.results || [])[0];
      if (row) {
        return {
          id: row.id,
          name: [row.name, row.admin1, row.country].filter(Boolean).join(', '),
          latitude: row.latitude,
          longitude: row.longitude,
          admin1: row.admin1,
          country: row.country,
        };
      }
    } catch {
      // Open-Meteo reverse is not always available; coordinates still save.
    }
    return {
      name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
    };
  }

  async getBlightWeatherSeries(latitude: number, longitude: number): Promise<BlightWeatherSeries> {
    const data = await this.fetchOpenMeteoJson(latitude, longitude);
    return this.buildBlightWeatherSeries(data);
  }

  async getDashboardWeather(farm: Farm | null) {
    if (!farm || farm.latitude == null || farm.longitude == null) {
      return null;
    }
    const snapshot = await this.ensureSnapshot(farm);
    const payload = this.readPayload(snapshot);
    return {
      temp: snapshot.temperature != null ? Math.round(Number(snapshot.temperature)) : null,
      humidity: snapshot.humidity != null ? Math.round(Number(snapshot.humidity)) : null,
      rainfall: snapshot.rainfall != null ? Number(Number(snapshot.rainfall).toFixed(1)) : null,
      wind: snapshot.windSpeed != null ? Math.round(Number(snapshot.windSpeed)) : null,
      condition: snapshot.condition || '—',
      location: farm.locationLabel || farm.address || farm.name,
      latitude: Number(farm.latitude),
      longitude: Number(farm.longitude),
      slot: snapshot.slot,
      fetchedAt: snapshot.fetchedAt,
      forecast: payload.forecast || [],
      rainfallHumidity: payload.rainfallHumidity || [],
      windTemperature: payload.windTemperature || [],
    };
  }

  @Cron('0 10 * * *', { timeZone: IST })
  async refreshMorningSlot() {
    this.logger.log('Refreshing farm weather for the 10:00 IST slot');
    await this.refreshAllFarms('morning', this.calendarDateIst(new Date()));
  }

  @Cron('0 18 * * *', { timeZone: IST })
  async refreshEveningSlot() {
    this.logger.log('Refreshing farm weather for the 18:00 IST slot');
    await this.refreshAllFarms('evening', this.calendarDateIst(new Date()));
  }

  private async refreshAllFarms(slot: Slot, date: string) {
    const farms = await this.farms
      .createQueryBuilder('farm')
      .where('farm.latitude IS NOT NULL')
      .andWhere('farm.longitude IS NOT NULL')
      .getMany();
    for (const farm of farms) {
      try {
        await this.fetchAndSave(farm, date, slot);
      } catch (err: any) {
        this.logger.warn(`Weather refresh failed for farm ${farm.id}: ${err?.message || err}`);
      }
    }
  }

  private async ensureSnapshot(farm: Farm): Promise<WeatherSnapshot> {
    const { date, slot } = this.istClock();
    const existing = await this.snapshots.findOne({
      where: { farmId: farm.id, snapshotDate: date, slot },
    });
    const payload = existing ? this.readPayload(existing) : {};
    if (existing && payload.chartRange === 'past7') return existing;
    return this.fetchAndSave(farm, date, slot);
  }

  private async fetchAndSave(farm: Farm, date: string, slot: Slot): Promise<WeatherSnapshot> {
    const lat = Number(farm.latitude);
    const lng = Number(farm.longitude);
    const live = await this.fetchOpenMeteo(lat, lng);
    let row = await this.snapshots.findOne({
      where: { farmId: farm.id, snapshotDate: date, slot },
    });
    if (!row) {
      row = this.snapshots.create({ farmId: farm.id, snapshotDate: date, slot });
    }
    row.fetchedAt = new Date();
    row.temperature = live.temperature;
    row.humidity = live.humidity;
    row.rainfall = live.rainfall;
    row.windSpeed = live.windSpeed;
    row.condition = live.condition;
    row.payload = JSON.stringify({
      chartRange: 'past7',
      rainfallHumidity: live.rainfallHumidity,
      windTemperature: live.windTemperature,
      forecast: live.forecast,
    });
    return this.snapshots.save(row);
  }

  private async fetchOpenMeteoJson(latitude: number, longitude: number) {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      timezone: IST,
      past_days: '7',
      forecast_days: '7',
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    });
    return this.getJson(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  }

  private buildBlightWeatherSeries(data: any): BlightWeatherSeries {
    const hourly = data.hourly || {};
    const times: string[] = hourly.time || [];
    const now = Date.now();
    const ms24 = 24 * 60 * 60 * 1000;
    const ms72 = 72 * 60 * 60 * 1000;
    let rainfall24h = 0;
    let rainfall72h = 0;

    times.forEach((stamp, idx) => {
      const t = new Date(stamp).getTime();
      const rain = this.num(hourly.precipitation?.[idx]) ?? 0;
      if (t >= now - ms24) rainfall24h += rain;
      if (t >= now - ms72) rainfall72h += rain;
    });

    const today = this.calendarDateIst(new Date());
    const byDay = this.aggregateHourly(hourly, today);
    const last3 = byDay.slice(-3);
    const last7 = byDay.slice(-7);
    const avgHumidity3d = last3.length
      ? Math.round(last3.reduce((sum, day) => sum + day.humidity, 0) / last3.length)
      : 0;
    const avgTemp3d = last3.length
      ? Math.round(last3.reduce((sum, day) => sum + day.temp, 0) / last3.length)
      : 0;
    const rainyDays7 = last7.filter((day) => day.rain >= 1).length;
    const current = data.current || {};

    return {
      currentTemp: this.num(current.temperature_2m) ?? avgTemp3d,
      currentHumidity: this.num(current.relative_humidity_2m) ?? avgHumidity3d,
      rainfall24h: Number(rainfall24h.toFixed(1)),
      rainfall72h: Number(rainfall72h.toFixed(1)),
      rainyDays7,
      avgHumidity3d,
      avgTemp3d,
      windSpeed: this.num(current.wind_speed_10m) ?? 0,
      fetchedAt: new Date().toISOString(),
    };
  }

  private async fetchOpenMeteo(latitude: number, longitude: number) {
    const data = await this.fetchOpenMeteoJson(latitude, longitude);
    const current = data.current || {};
    const daily = data.daily || {};
    const byDay = this.aggregateHourly(data.hourly || {}, this.calendarDateIst(new Date()));

    const rainfallHumidity: WeatherChartPoint[] = byDay.map((d) => ({
      day: d.label,
      rainfall: d.rain,
      humidity: d.humidity,
    }));
    const windTemperature: WeatherChartPoint[] = byDay.map((d) => ({
      day: d.label,
      wind: d.wind,
      temp: d.temp,
    }));

    const humidityByDate = new Map(byDay.map((d) => [d.date, d.humidity]));
    const today = this.calendarDateIst(new Date());
    const forecast: WeatherForecastDay[] = (daily.time || [])
      .map((date: string, idx: number) => ({
        date,
        weekday: new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short' }),
        tMax: this.num(daily.temperature_2m_max?.[idx]),
        tMin: this.num(daily.temperature_2m_min?.[idx]),
        rain: this.num(daily.precipitation_sum?.[idx]),
        wind: this.num(daily.wind_speed_10m_max?.[idx]),
        humidity: humidityByDate.get(date) ?? null,
        condition: this.weatherLabel(daily.weather_code?.[idx]),
      }))
      .filter((day: WeatherForecastDay) => day.date >= today)
      .slice(0, 7);

    const todayIso = this.calendarDateIst(new Date());
    const todayRain = byDay.find((d) => d.date === todayIso)?.rain
      ?? this.num(current.precipitation)
      ?? 0;

    return {
      temperature: this.num(current.temperature_2m),
      humidity: this.num(current.relative_humidity_2m),
      rainfall: todayRain,
      windSpeed: this.num(current.wind_speed_10m),
      condition: this.weatherLabel(current.weather_code),
      rainfallHumidity,
      windTemperature,
      forecast,
    };
  }

  private aggregateHourly(hourly: any, today: string) {
    const times: string[] = hourly.time || [];
    const buckets = new Map<string, { temp: number[]; humidity: number[]; rain: number; wind: number[] }>();
    times.forEach((stamp, idx) => {
      const date = stamp.slice(0, 10);
      if (date > today) return;
      if (!buckets.has(date)) buckets.set(date, { temp: [], humidity: [], rain: 0, wind: [] });
      const b = buckets.get(date)!;
      const t = this.num(hourly.temperature_2m?.[idx]);
      const h = this.num(hourly.relative_humidity_2m?.[idx]);
      const r = this.num(hourly.precipitation?.[idx]);
      const w = this.num(hourly.wind_speed_10m?.[idx]);
      if (t != null) b.temp.push(t);
      if (h != null) b.humidity.push(h);
      if (r != null) b.rain += r;
      if (w != null) b.wind.push(w);
    });
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, b]) => ({
        date,
        label: new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        temp: b.temp.length ? Math.round(b.temp.reduce((s, n) => s + n, 0) / b.temp.length) : 0,
        humidity: b.humidity.length ? Math.round(b.humidity.reduce((s, n) => s + n, 0) / b.humidity.length) : 0,
        rain: Number(b.rain.toFixed(1)),
        wind: b.wind.length ? Math.round(b.wind.reduce((s, n) => s + n, 0) / b.wind.length) : 0,
      }));
  }

  private calendarDateIst(at: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(at);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  private shiftIsoDate(isoDate: string, days: number): string {
    const d = new Date(`${isoDate}T12:00:00+05:30`);
    d.setDate(d.getDate() + days);
    return this.calendarDateIst(d);
  }

  private istClock(): { date: string; hour: number; slot: Slot } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    const today = `${get('year')}-${get('month')}-${get('day')}`;
    const hour = Number(get('hour'));
    if (hour < 10) {
      return { date: this.shiftIsoDate(today, -1), hour, slot: 'evening' };
    }
    if (hour < 18) {
      return { date: today, hour, slot: 'morning' };
    }
    return { date: today, hour, slot: 'evening' };
  }

  private weatherLabel(code: unknown): string {
    const n = Number(code);
    if (!Number.isFinite(n)) return '—';
    if (n === 0) return 'Clear';
    if (n <= 3) return 'Partly Cloudy';
    if (n <= 48) return 'Fog';
    if (n <= 57) return 'Drizzle';
    if (n <= 67) return 'Rain';
    if (n <= 77) return 'Snow';
    if (n <= 82) return 'Showers';
    if (n <= 86) return 'Snow Showers';
    return 'Thunderstorm';
  }

  private num(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private readPayload(snapshot: WeatherSnapshot) {
    if (!snapshot.payload) return {} as { chartRange?: string; forecast?: WeatherForecastDay[]; rainfallHumidity?: WeatherChartPoint[]; windTemperature?: WeatherChartPoint[] };
    try {
      return JSON.parse(snapshot.payload);
    } catch {
      return {};
    }
  }

  private async getJson(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed (${response.status})`);
    }
    return response.json();
  }
}
