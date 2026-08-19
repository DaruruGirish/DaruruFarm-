import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Leaf, Upload, X, Image as ImageIcon } from 'lucide-react';

export type PlantPart = 'leaf' | 'fruit';

export interface GalleryPick {
  id: number;
  filename: string;
  caption?: string;
  farmId?: number;
}

interface VisionResult {
  plant_part: PlantPart;
  disease: string;
  confidence: number;
  uncertain?: boolean;
  top_predictions: { disease: string; confidence: number }[];
}

interface SavedPrediction {
  id: number;
  imageUrl: string;
  predictedDisease: string;
  confidence: number;
  plantPart: string;
  uncertain: boolean;
  createdAt: string;
  farm?: { name: string } | null;
}

interface WeatherResult {
  risk_percentage: number;
  risk_level: string;
  recommendation: {
    action: string;
    irrigation: string;
    protocol: string;
  };
}

interface DiseasePredictorProps {
  token?: string;
  farms?: { id: number; name: string }[];
  galleryImages?: GalleryPick[];
  pendingGallery?: GalleryPick | null;
  onAnalyzed?: () => void;
}

function guessPlantPart(name = ''): PlantPart {
  return name.toLowerCase().includes('leaf') ? 'leaf' : 'fruit';
}

function formatDisease(name: string) {
  return name
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function friendlyError(raw: string) {
  const text = (raw || '').toLowerCase();
  if (
    text.includes('not running') ||
    text.includes('uvicorn') ||
    text.includes('not been trained') ||
    text.includes('weights were not found') ||
    text.includes('econnrefused')
  ) {
    return 'Photo analysis is not ready yet. You can still log an outbreak by hand. Analyze needs the trained leaf and fruit models to be running.';
  }
  return raw || 'Could not analyze this image.';
}

const weatherInitial = {
  rainfall_mm: '' as unknown as number,
  humidity: '' as unknown as number,
  temperature: '' as unknown as number,
};

export const WeatherOutbreakRisk: React.FC<{
  token?: string;
  defaults?: { rainfall_mm?: number; humidity?: number; temperature?: number };
}> = ({ token, defaults }) => {
  const [weatherForm, setWeatherForm] = useState(weatherInitial);
  const [weatherResult, setWeatherResult] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    setWeatherForm((prev) => ({
      rainfall_mm: defaults?.rainfall_mm ?? prev.rainfall_mm,
      humidity: defaults?.humidity ?? prev.humidity,
      temperature: defaults?.temperature ?? prev.temperature,
    }));
  }, [defaults?.rainfall_mm, defaults?.humidity, defaults?.temperature]);

  const submitWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeatherLoading(true);
    try {
      const response = await fetch('/api/disease-management/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(weatherForm),
      });
      if (!response.ok) throw new Error('Could not calculate weather risk.');
      setWeatherResult(await response.json());
    } catch (err: any) {
      toast.error(err.message || 'Could not calculate weather risk.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const level = weatherResult?.risk_level?.toUpperCase() || '';
  const levelClass = level.includes('HIGH') || level.includes('CRIT')
    ? 'text-red-700'
    : level.includes('MED')
      ? 'text-amber-700'
      : 'text-emerald-800';

  return (
    <div className="glass-card rounded-2xl border border-zinc-200 p-5 space-y-4">
      <div>
        <p className="text-sm font-bold text-zinc-900">Weather outbreak risk</p>
        <p className="text-xs text-zinc-500 mt-0.5">Uses rainfall, humidity, and temperature — not a photo check.</p>
      </div>
      <form onSubmit={submitWeather} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { name: 'rainfall_mm', label: 'Rainfall (mm)' },
          { name: 'humidity', label: 'Humidity (%)' },
          { name: 'temperature', label: 'Temperature (°C)' },
        ] as const).map((field) => (
          <label key={field.name} className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            {field.label}
            <input
              type="number"
              required
              value={weatherForm[field.name] ?? ''}
              onChange={(e) => setWeatherForm({ ...weatherForm, [field.name]: e.target.value ? Number(e.target.value) : undefined as any })}
              className="df-input mt-1 font-normal normal-case"
            />
          </label>
        ))}
        <button type="submit" disabled={weatherLoading} className="df-btn df-btn-primary sm:col-span-3">
          {weatherLoading ? 'Calculating…' : 'Get weather risk'}
        </button>
        {weatherResult && (
          <div className="sm:col-span-3 rounded-xl border border-zinc-200 bg-[#f7f4ec] p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase text-zinc-500 font-bold">Risk</p>
              <p className={`text-3xl font-bold ${levelClass}`}>{weatherResult.risk_percentage}%</p>
              <p className={`text-xs font-bold uppercase mt-1 ${levelClass}`}>{weatherResult.risk_level}</p>
            </div>
            <div className="md:col-span-2 space-y-1 text-sm text-zinc-700">
              <p>{weatherResult.recommendation.action}</p>
              <p>{weatherResult.recommendation.irrigation}</p>
              <p>{weatherResult.recommendation.protocol}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

const DiseasePredictor: React.FC<DiseasePredictorProps> = ({
  token,
  farms = [],
  galleryImages = [],
  pendingGallery,
  onAnalyzed,
}) => {
  const [plantPart, setPlantPart] = useState<PlantPart>('leaf');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [galleryId, setGalleryId] = useState<number | null>(null);
  const [farmId, setFarmId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<VisionResult | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [history, setHistory] = useState<SavedPrediction[]>([]);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = async () => {
    if (!token) return;
    const res = await fetch('/api/disease-management/predictions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setHistory(await res.json());
  };

  useEffect(() => {
    loadHistory();
  }, [token]);

  useEffect(() => {
    if (!pendingGallery) return;
    setGalleryId(pendingGallery.id);
    setFile(null);
    setPreview(`/api/uploads/${pendingGallery.filename}`);
    setPlantPart(guessPlantPart(`${pendingGallery.filename} ${pendingGallery.caption || ''}`));
    if (pendingGallery.farmId) setFarmId(String(pendingGallery.farmId));
    setResult(null);
    setError('');
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pendingGallery]);

  const clearPhoto = () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(null);
    setGalleryId(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  const selectFile = (next: File | null) => {
    if (!next) return;
    if (!next.type.startsWith('image/')) {
      setError('Please choose a photo file (JPG, PNG, or WebP).');
      return;
    }
    setFile(next);
    setGalleryId(null);
    setResult(null);
    setError('');
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));
  };

  const selectGallery = (image: GalleryPick) => {
    setGalleryId(image.id);
    setFile(null);
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(`/api/uploads/${image.filename}`);
    setPlantPart(guessPlantPart(`${image.filename} ${image.caption || ''}`));
    if (image.farmId) setFarmId(String(image.farmId));
    setResult(null);
    setError('');
  };

  const analyze = async () => {
    if (!file && !galleryId) {
      setError('Choose a leaf or fruit photo first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let response: Response;
      if (galleryId) {
        response = await fetch(`/api/disease-management/vision-gallery/${galleryId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            plantPart,
            farmId: farmId ? Number(farmId) : undefined,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append('image', file as File);
        if (farmId) formData.append('farmId', farmId);
        response = await fetch(`/api/disease-management/vision/${plantPart}`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const raw = data.message || data.detail;
        throw new Error(Array.isArray(raw) ? raw[0] : raw || 'Could not analyze this image.');
      }
      setResult(data);
      loadHistory();
      onAnalyzed?.();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      const score = Number(data.confidence) || 0;
      const disease = String(data.disease || '').toLowerCase();
      if (score > 85 && disease && disease !== 'healthy') {
        toast.success(`High-confidence detection (${score.toFixed(0)}%). Added to active diseases.`);
      } else if (data.uncertain) {
        toast.message('Model confidence is low. Treat this as a hint, not a diagnosis.');
      } else {
        toast.success('Photo analysis complete');
      }
    } catch (err: any) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const ready = Boolean(file || galleryId);
  const confidence = result ? Math.max(0, Math.min(100, Number(result.confidence) || 0)) : 0;

  return (
    <div ref={rootRef} id="ai-disease-detection" className="space-y-6">
      {pendingGallery && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Gallery photo loaded. Confirm whether it is a leaf or fruit, then tap Analyze.
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Photo check</p>
          <h2 className="text-lg font-bold text-zinc-900 mt-1">Check a leaf or fruit photo</h2>
          <p className="text-sm text-zinc-500 mt-1">
            This is a computer-vision check trained on public pomegranate fruit photos. Leaf photos are less reliable. The number shown is model confidence, not a confirmed diagnosis.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-600 mb-2">What did you photograph?</p>
          <div className="grid grid-cols-2 gap-2">
            {(['leaf', 'fruit'] as PlantPart[]).map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => setPlantPart(part)}
                className={`df-btn ${plantPart === part ? 'df-btn-primary' : 'df-btn-ghost'}`}
              >
                {part === 'leaf' ? <Leaf className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                {part === 'leaf' ? 'Leaf' : 'Fruit'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-600 mb-2">Add a photo</p>
          <label
            onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
            onDragLeave={() => setDropActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropActive(false);
              selectFile(e.dataTransfer.files?.[0] || null);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              dropActive ? 'border-emerald-700 bg-emerald-50' : 'border-zinc-200 bg-[#f7f4ec] hover:border-emerald-700'
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Selected crop" className="w-full max-h-64 object-contain rounded-xl bg-white" />
                <span className="text-xs text-zinc-500 mt-3">Tap to replace this photo</span>
              </>
            ) : (
              <>
                <Upload className="w-7 h-7 text-emerald-800 mb-2" />
                <span className="text-sm font-semibold text-zinc-800">Take or upload a photo</span>
                <span className="text-xs text-zinc-500 mt-1">Fill the frame with the leaf or fruit. Avoid blur and heavy shadow.</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0] || null)}
            />
          </label>
          {preview && (
            <button type="button" onClick={clearPhoto} className="mt-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Remove photo
            </button>
          )}
        </div>

        {galleryImages.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-600 mb-2">Or pick from Gallery</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {galleryImages.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => selectGallery(image)}
                  className={`shrink-0 w-20 rounded-xl overflow-hidden border bg-white text-left ${
                    galleryId === image.id ? 'border-emerald-700 ring-2 ring-emerald-700/20' : 'border-zinc-200'
                  }`}
                >
                  <img src={`/api/uploads/${image.filename}`} alt={image.caption || 'Gallery'} className="h-16 w-full object-cover" />
                  <span className="block px-1.5 py-1 text-[9px] text-zinc-500 line-clamp-2">{image.caption || 'Photo'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {farms.length > 0 && (
          <label className="block">
            <span className="text-xs font-semibold text-zinc-600">Attach to a holding (optional)</span>
            <select className="df-input mt-1" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
              <option value="">Do not attach a farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          disabled={loading || !ready}
          onClick={analyze}
          className="df-btn df-btn-primary w-full h-11"
        >
          {loading ? 'Looking at the photo…' : ready ? 'Analyze photo' : 'Choose a photo to analyze'}
        </button>
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {error}
          </div>
        )}

        {result && (
          <div ref={resultRef} className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">AI analysis</p>
            <div>
              <p className="text-xs text-zinc-500">Suggested class</p>
              <p className="text-2xl font-bold text-zinc-900">{formatDisease(result.disease)}</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Model confidence</span>
                <span className="font-bold text-zinc-800">{confidence.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${result.uncertain ? 'bg-amber-500' : 'bg-emerald-700'}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-zinc-600">
              Checked as a <span className="font-semibold capitalize">{result.plant_part || plantPart}</span> photo.
            </p>
            {result.uncertain && (
              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Confidence is low. Try a closer, sharper photo, or switch Leaf / Fruit if the plant part is wrong.
              </p>
            )}
            {result.top_predictions?.length > 1 && (
              <div>
                <p className="text-xs font-bold text-zinc-600 mb-2">Other possibilities</p>
                <ul className="space-y-2">
                  {result.top_predictions.slice(1).map((item) => (
                    <li key={item.disease} className="flex justify-between text-sm text-zinc-700">
                      <span>{formatDisease(item.disease)}</span>
                      <span className="font-semibold">{Number(item.confidence).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-zinc-900 mb-3">Recent photo checks</h3>
          <div className="space-y-2">
            {history.slice(0, 6).map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2">
                <img src={`/api/uploads/${row.imageUrl}`} alt="" className="w-12 h-12 rounded-lg object-cover bg-[#efe9d8]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{formatDisease(row.predictedDisease)}</p>
                  <p className="text-[11px] text-zinc-500">
                    {Number(row.confidence).toFixed(0)}% · {row.plantPart}
                    {row.farm?.name ? ` · ${row.farm.name}` : ''}
                    {row.uncertain ? ' · uncertain' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseasePredictor;
