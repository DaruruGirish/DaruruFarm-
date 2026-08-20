import React, { useEffect, useState } from 'react';
import { AlertTriangle, Droplets, RefreshCw, Thermometer, Wind } from 'lucide-react';
import { toast } from 'sonner';

type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';

type RiskFactor = {
  key: string;
  label: string;
  weight: number;
  score: number;
  weighted: number;
};

type BlightRiskResponse = {
  disease: string;
  score: number;
  riskLevel: RiskLevel;
  summary: string;
  reasons: string[];
  topFactors: RiskFactor[];
  factors: RiskFactor[];
  disclaimer: string;
  farm?: { id: number; name: string };
  weatherFetchedAt?: string;
  inputs?: {
    currentTemp: number;
    currentHumidity: number;
    rainfall24h: number;
    rainfall72h: number;
    rainyDays7: number;
    avgHumidity3d: number;
    avgTemp3d: number;
    windSpeed: number;
  };
};

const levelStyles: Record<RiskLevel, { badge: string; bar: string; label: string }> = {
  LOW: {
    badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
    bar: 'bg-emerald-600',
    label: 'Low Risk',
  },
  MODERATE: {
    badge: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    bar: 'bg-amber-500',
    label: 'Moderate Risk',
  },
  HIGH: {
    badge: 'bg-orange-500/10 text-orange-800 border-orange-500/20',
    bar: 'bg-orange-500',
    label: 'High Risk',
  },
  'VERY HIGH': {
    badge: 'bg-red-500/10 text-red-700 border-red-500/20',
    bar: 'bg-red-600',
    label: 'Very High Risk',
  },
};

export const PomegranateBacterialBlightRisk: React.FC<{
  token?: string;
  farmId?: number;
  hasLocation?: boolean;
  farmName?: string;
}> = ({ token, farmId, hasLocation, farmName }) => {
  const [result, setResult] = useState<BlightRiskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRisk = async () => {
    if (!token || !farmId || !hasLocation) return;
    setLoading(true);
    try {
      const res = await fetch('/api/disease-management/predict', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ farmId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Could not calculate bacterial blight risk.');
      }
      setResult(await res.json());
    } catch (err: any) {
      toast.error(err.message || 'Could not calculate bacterial blight risk.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, farmId, hasLocation]);

  if (!hasLocation || !farmId) {
    return (
      <div className="glass-card rounded-xl border border-zinc-200 p-5 text-sm text-zinc-500">
        Save a farm location to calculate pomegranate bacterial blight risk from Open-Meteo weather history.
      </div>
    );
  }

  const styles = result ? levelStyles[result.riskLevel] : levelStyles.LOW;

  return (
    <div className="glass-card rounded-xl border border-zinc-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Pomegranate bacterial blight</p>
          <h3 className="text-sm font-bold text-zinc-900 mt-1">Weather outbreak indicator</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Uses live Open-Meteo readings plus 24h/72h rainfall, rainy-day count, and 3-day humidity/temperature averages
            {farmName ? ` · ${farmName}` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRisk}
          disabled={loading}
          className="df-btn df-btn-ghost shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && !result ? (
        <p className="text-sm text-zinc-500">Calculating risk from recent weather…</p>
      ) : result ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${styles.badge}`}>
              <AlertTriangle className="w-4 h-4" />
              {styles.label} — {result.score}/100
            </span>
            <p className="text-sm text-zinc-700">{result.reasons.join(' + ')}.</p>
          </div>

          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className={`h-full transition-all ${styles.bar}`} style={{ width: `${result.score}%` }} />
          </div>

          {result.inputs && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="rounded-lg border border-zinc-200 bg-[#fbfaf6] px-2.5 py-2">
                <div className="flex items-center gap-1 text-zinc-500"><Thermometer className="w-3 h-3" /> Now / 3d avg</div>
                <p className="font-bold text-zinc-900 mt-1">{Math.round(result.inputs.currentTemp)}° / {Math.round(result.inputs.avgTemp3d)}°</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-[#fbfaf6] px-2.5 py-2">
                <div className="flex items-center gap-1 text-zinc-500"><Droplets className="w-3 h-3" /> Humidity</div>
                <p className="font-bold text-zinc-900 mt-1">{Math.round(result.inputs.currentHumidity)}% / {Math.round(result.inputs.avgHumidity3d)}%</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-[#fbfaf6] px-2.5 py-2">
                <div className="flex items-center gap-1 text-zinc-500"><Droplets className="w-3 h-3" /> Rain 24h / 72h</div>
                <p className="font-bold text-zinc-900 mt-1">{result.inputs.rainfall24h.toFixed(1)} / {result.inputs.rainfall72h.toFixed(1)} mm</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-[#fbfaf6] px-2.5 py-2">
                <div className="flex items-center gap-1 text-zinc-500"><Wind className="w-3 h-3" /> Rainy days / wind</div>
                <p className="font-bold text-zinc-900 mt-1">{result.inputs.rainyDays7} / {Math.round(result.inputs.windSpeed)} km/h</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-zinc-800 mb-2">Top contributing factors</p>
            <div className="space-y-2">
              {result.topFactors.map((factor) => (
                <div key={factor.key} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-600">
                    <span>{factor.label} ({Math.round(factor.weight * 100)}% weight)</span>
                    <span className="font-semibold text-zinc-800">{factor.score}/100 · +{factor.weighted}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-emerald-700/70" style={{ width: `${factor.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-200 pt-3">
            {result.disclaimer}
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Risk could not be loaded. Try refresh after saving the farm location.</p>
      )}
    </div>
  );
};

export default PomegranateBacterialBlightRisk;
