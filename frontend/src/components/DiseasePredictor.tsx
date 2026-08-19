// DiseasePredictor.tsx
// A UI component to submit telemetry data and view disease risk prediction

import React, { useState } from 'react';

interface PredictionResult {
  risk_percentage: number;
  risk_level: string;
  recommendation: {
    action: string;
    irrigation: string;
    protocol: string;
  };
}

const initialForm = {
  rainfall_mm: '' as unknown as number,
  humidity: '' as unknown as number,
  temperature: '' as unknown as number,
  recent_disease_count: '' as unknown as number,
  recent_high_severity_count: '' as unknown as number,
  irrigation_liters: '' as unknown as number,
  pesticide_spray_count: '' as unknown as number,
  disease_log_count: '' as unknown as number,
  pest_inspection_count: '' as unknown as number,
};

type FormFields = typeof initialForm;

const DiseasePredictor: React.FC<{ token?: string }> = ({ token }) => {
  const [form, setForm] = useState<FormFields>(initialForm);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value ? Number(value) : undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/disease-management/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Server error: ${response.status} ${txt}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Crop Disease Risk Predictor</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <label className="block">
          Rainfall (mm)
          <input
            type="number"
            name="rainfall_mm"
            value={form.rainfall_mm ?? ''}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Humidity (%)
          <input
            type="number"
            name="humidity"
            value={form.humidity ?? ''}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Temperature (°C)
          <input
            type="number"
            name="temperature"
            value={form.temperature ?? ''}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Recent Disease Count
          <input
            type="number"
            name="recent_disease_count"
            value={form.recent_disease_count ?? ''}
            onChange={handleChange}
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Recent High Severity Count
          <input
            type="number"
            name="recent_high_severity_count"
            value={form.recent_high_severity_count ?? ''}
            onChange={handleChange}
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Irrigation Liters
          <input
            type="number"
            name="irrigation_liters"
            value={form.irrigation_liters ?? ''}
            onChange={handleChange}
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Pesticide Spray Count
          <input
            type="number"
            name="pesticide_spray_count"
            value={form.pesticide_spray_count ?? ''}
            onChange={handleChange}
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Disease Log Count
          <input
            type="number"
            name="disease_log_count"
            value={form.disease_log_count ?? ''}
            onChange={handleChange}
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <label className="block">
          Pest Inspection Count
          <input
            type="number"
            name="pest_inspection_count"
            value={form.pest_inspection_count ?? ''}
            onChange={handleChange}
            className="mt-1 w-full rounded bg-gray-800 border border-gray-700 p-1"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="col-span-2 mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-semibold"
        >
          {loading ? 'Predicting...' : 'Get Prediction'}
        </button>
      </form>
      {error && <p className="mt-2 text-red-400">Error: {error}</p>}
      {result && (
        <div className="mt-4 p-3 bg-gray-800 rounded">
          <p>Risk: <strong>{result.risk_percentage}%</strong> ({result.risk_level})</p>
          <h3 className="mt-2 font-semibold">Recommendation</h3>
          <ul className="list-disc list-inside">
            <li>{result.recommendation.action}</li>
            <li>{result.recommendation.irrigation}</li>
            <li>{result.recommendation.protocol}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiseasePredictor;
