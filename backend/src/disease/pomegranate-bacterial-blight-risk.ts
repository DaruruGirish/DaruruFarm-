export type BlightWeatherInputs = {
  currentTemp: number;
  currentHumidity: number;
  rainfall24h: number;
  rainfall72h: number;
  rainyDays7: number;
  avgHumidity3d: number;
  avgTemp3d: number;
  windSpeed: number;
};

export type BlightRiskFactor = {
  key: 'temperature' | 'humidity' | 'rainfall' | 'persistence' | 'wind';
  label: string;
  weight: number;
  score: number;
  weighted: number;
};

export type BlightRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';

export type BlightRiskResult = {
  disease: 'Pomegranate Bacterial Blight';
  score: number;
  riskLevel: BlightRiskLevel;
  summary: string;
  reasons: string[];
  topFactors: BlightRiskFactor[];
  factors: BlightRiskFactor[];
  inputs: BlightWeatherInputs;
  disclaimer: string;
};

const DISCLAIMER =
  'Rule-based indicator for pomegranate bacterial blight using Open-Meteo weather. Not a scientifically validated prediction until trained and validated against real pomegranate disease and weather data.';

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function scoreTemperature(current: number, avg3d: number): number {
  const t = avg3d * 0.55 + current * 0.45;
  if (t < 18 || t > 40) return 8;
  if (t >= 25 && t <= 35) {
    const dist = Math.abs(t - 30);
    return Math.round(clamp(100 - dist * 5, 72, 100));
  }
  if (t >= 20 && t < 25) return Math.round(30 + (t - 20) * 8);
  if (t > 35 && t <= 40) return Math.round(30 + (40 - t) * 8);
  return 15;
}

function scoreHumidity(current: number, avg3d: number): number {
  const h = avg3d * 0.6 + current * 0.4;
  if (h < 55) return Math.round(clamp((h - 40) * 2, 0, 20));
  if (h >= 80) return Math.round(clamp(72 + (h - 80) * 1.4, 72, 92));
  if (h >= 70) return Math.round(48 + (h - 70) * 2.4);
  return Math.round((h - 55) * 3.2);
}

function scoreRainfall(rain24h: number, rain72h: number): number {
  let score = 0;
  if (rain24h >= 10) score += 52 + Math.min(28, (rain24h - 10) * 2.2);
  else if (rain24h >= 5) score += 28 + (rain24h - 5) * 4.8;
  else score += rain24h * 5.5;

  if (rain72h >= 30) score += 22;
  else if (rain72h >= 15) score += 10 + (rain72h - 15) * 0.8;
  else score += rain72h * 0.55;

  return Math.round(clamp(score, 0, 100));
}

function scorePersistence(rainyDays7: number, avgHumidity3d: number, rain72h: number): number {
  let score = 0;
  if (rainyDays7 >= 4) score += 42;
  else if (rainyDays7 >= 3) score += 34;
  else if (rainyDays7 >= 2) score += 22;
  else if (rainyDays7 >= 1) score += 10;

  if (avgHumidity3d >= 82) score += 32;
  else if (avgHumidity3d >= 75) score += 22;
  else if (avgHumidity3d >= 70) score += 12;

  if (rain72h >= 20 && rainyDays7 >= 2) score += 14;
  return Math.round(clamp(score, 0, 100));
}

function scoreWindSpread(windSpeed: number, rain24h: number, rain72h: number): number {
  if (rain24h < 2 && rain72h < 6) return 8;
  if (windSpeed >= 28) return Math.round(clamp(55 + (windSpeed - 28) * 1.5, 55, 85));
  if (windSpeed >= 14) return Math.round(38 + (windSpeed - 14) * 1.2);
  if (windSpeed >= 6) return Math.round(18 + (windSpeed - 6) * 2);
  return 12;
}

function riskLevelFromScore(score: number): BlightRiskLevel {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MODERATE';
  if (score <= 80) return 'HIGH';
  return 'VERY HIGH';
}

function buildReasons(inputs: BlightWeatherInputs, factors: BlightRiskFactor[]): string[] {
  const reasons: string[] = [];

  if (inputs.currentHumidity >= 70 || inputs.avgHumidity3d >= 70) {
    const h = Math.max(inputs.currentHumidity, inputs.avgHumidity3d);
    reasons.push(`High humidity (${Math.round(h)}%)`);
  }
  if (inputs.rainfall24h >= 5) {
    reasons.push(`${inputs.rainfall24h.toFixed(1)} mm rainfall in the last 24h`);
  } else if (inputs.rainfall72h >= 10) {
    reasons.push(`${inputs.rainfall72h.toFixed(1)} mm rainfall in the last 72h`);
  }
  if (inputs.rainyDays7 >= 2) {
    reasons.push(`Repeated rainfall over the last ${inputs.rainyDays7} days`);
  }
  if (inputs.avgHumidity3d >= 75 && inputs.rainyDays7 >= 2) {
    reasons.push('Humidity has stayed elevated for several days');
  }
  const temp = inputs.avgTemp3d * 0.55 + inputs.currentTemp * 0.45;
  if (temp >= 25 && temp <= 35) {
    reasons.push(`Temperature in favourable range (${Math.round(temp)}°C)`);
  }
  if (inputs.windSpeed >= 14 && inputs.rainfall24h >= 5) {
    reasons.push(`Wind may spread splash (${Math.round(inputs.windSpeed)} km/h)`);
  }

  if (reasons.length === 0) {
    const top = [...factors].sort((a, b) => b.weighted - a.weighted)[0];
    reasons.push(`${top.label} is the main contributor right now`);
  }

  return reasons.slice(0, 4);
}

function buildSummary(level: BlightRiskLevel, score: number, reasons: string[]): string {
  const label =
    level === 'VERY HIGH'
      ? 'Very High Risk'
      : level === 'HIGH'
        ? 'High Risk'
        : level === 'MODERATE'
          ? 'Moderate Risk'
          : 'Low Risk';
  const detail = reasons.slice(0, 3).join(' + ');
  return `${label} — ${score}/100. ${detail}.`;
}

export function calculatePomegranateBacterialBlightRisk(raw: Partial<BlightWeatherInputs>): BlightRiskResult {
  const inputs: BlightWeatherInputs = {
    currentTemp: raw.currentTemp ?? 28,
    currentHumidity: raw.currentHumidity ?? 65,
    rainfall24h: raw.rainfall24h ?? 0,
    rainfall72h: raw.rainfall72h ?? 0,
    rainyDays7: raw.rainyDays7 ?? 0,
    avgHumidity3d: raw.avgHumidity3d ?? raw.currentHumidity ?? 65,
    avgTemp3d: raw.avgTemp3d ?? raw.currentTemp ?? 28,
    windSpeed: raw.windSpeed ?? 8,
  };

  const factorDefs: Array<{ key: BlightRiskFactor['key']; label: string; weight: number; score: number }> = [
    {
      key: 'temperature',
      label: 'Temperature',
      weight: 0.25,
      score: scoreTemperature(inputs.currentTemp, inputs.avgTemp3d),
    },
    {
      key: 'humidity',
      label: 'Humidity',
      weight: 0.3,
      score: scoreHumidity(inputs.currentHumidity, inputs.avgHumidity3d),
    },
    {
      key: 'rainfall',
      label: 'Rainfall',
      weight: 0.3,
      score: scoreRainfall(inputs.rainfall24h, inputs.rainfall72h),
    },
    {
      key: 'persistence',
      label: 'Recent wetness',
      weight: 0.1,
      score: scorePersistence(inputs.rainyDays7, inputs.avgHumidity3d, inputs.rainfall72h),
    },
    {
      key: 'wind',
      label: 'Wind spread',
      weight: 0.05,
      score: scoreWindSpread(inputs.windSpeed, inputs.rainfall24h, inputs.rainfall72h),
    },
  ];

  const factors: BlightRiskFactor[] = factorDefs.map((f) => ({
    ...f,
    weighted: Number((f.score * f.weight).toFixed(1)),
  }));

  const rainfallScore = factors.find((f) => f.key === 'rainfall')!.score;
  const persistenceScore = factors.find((f) => f.key === 'persistence')!.score;
  const tempScore = factors.find((f) => f.key === 'temperature')!.score;
  const humidityScore = factors.find((f) => f.key === 'humidity')!.score;

  let score = Math.round(factors.reduce((sum, f) => sum + f.weighted, 0));

  // High humidity alone must not reach VERY HIGH.
  if (rainfallScore < 40 && persistenceScore < 45) {
    score = Math.min(score, 78);
  }
  if (score > 80) {
    const strongCombo =
      rainfallScore >= 45 &&
      persistenceScore >= 40 &&
      tempScore >= 55 &&
      (inputs.rainfall24h >= 10 || inputs.rainyDays7 >= 2);
    if (!strongCombo) {
      score = Math.min(score, 80);
    }
  }
  // Dampen score when temperature is outside the favourable band even if humidity is high.
  if (tempScore < 40 && humidityScore >= 70) {
    score = Math.min(score, 65);
  }

  score = clamp(score, 0, 100);
  const riskLevel = riskLevelFromScore(score);
  const reasons = buildReasons(inputs, factors);
  const topFactors = [...factors].sort((a, b) => b.weighted - a.weighted).slice(0, 3);

  return {
    disease: 'Pomegranate Bacterial Blight',
    score,
    riskLevel,
    summary: buildSummary(riskLevel, score, reasons),
    reasons,
    topFactors,
    factors,
    inputs,
    disclaimer: DISCLAIMER,
  };
}
