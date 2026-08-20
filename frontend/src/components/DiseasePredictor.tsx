import React, { useRef, useState } from 'react';

type FarmOption = { id: number; name: string };

type AnalyzeResult = {
  disease: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  heatmap: string | null;
  imageUrl?: string;
};

type Props = {
  farms?: FarmOption[];
  token?: string | null;
  canEdit?: boolean;
  onResult?: (result: AnalyzeResult) => void;
};

const formatDisease = (name: string) =>
  (name || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const DiseasePredictor: React.FC<Props> = ({
  farms = [],
  token,
  canEdit = true,
  onResult,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [farmId, setFarmId] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    setResult(null);
    setPreview(URL.createObjectURL(file));
    if (!token) {
      setError('Sign in to analyze fruit photos.');
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append('image', file);
      if (farmId) body.append('farmId', farmId);
      const res = await fetch('/api/disease-management/analyze-fruit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Fruit analysis failed.');
      }
      setResult(data);
      onResult?.(data);
    } catch (err: any) {
      setError(err?.message || 'Fruit analysis failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-zinc-200 space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Photo check</p>
        <h2 className="text-lg font-bold text-zinc-900 mt-1">Pomegranate fruit AI</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Upload one fruit photo for disease class, confidence, Grad-CAM++ attention, and HBDS severity.
        </p>
      </div>

      {farms.length > 0 && (
        <select
          className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800 outline-none"
          value={farmId}
          onChange={(e) => setFarmId(e.target.value)}
          disabled={!canEdit || busy}
        >
          <option value="">Farm (optional)</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-44 h-36 rounded-xl overflow-hidden bg-[#efe9d8] border border-zinc-200 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
          ) : (
            <p className="text-xs text-zinc-500 px-3 text-center">Fruit photo preview</p>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="df-btn df-btn-ghost"
            disabled={!canEdit || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Analyzing…' : 'Upload fruit photo'}
          </button>
          {busy && (
            <p className="text-xs text-zinc-500">Usually 10–30 seconds once the model server is warm.</p>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}
          {!canEdit && (
            <p className="text-xs text-zinc-500">Inspector accounts can view results but cannot upload.</p>
          )}
        </div>
      </div>

      {result && (
        <div className="border-t border-zinc-200 pt-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-zinc-900">{formatDisease(result.disease)}</p>
            <p className="text-xs text-emerald-800 font-semibold mt-1">
              {(result.confidence * 100).toFixed(1)}% confidence
              {result.severity ? ` · severity ${result.severity}` : result.disease === 'Healthy' ? ' · healthy' : ''}
            </p>
          </div>
          {result.heatmap && (
            <div className="rounded-xl overflow-hidden border border-zinc-200 bg-[#efe9d8] max-w-md">
              <img
                src={`/api/uploads/${result.heatmap}`}
                alt="Grad-CAM++ heatmap"
                className="w-full h-40 object-cover"
              />
              <p className="text-[10px] text-zinc-500 px-2 py-1">Grad-CAM++ lesion attention</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiseasePredictor;
