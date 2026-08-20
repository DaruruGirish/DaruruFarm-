import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';

export type FruitPipelineResult = {
  disease: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  heatmap: string | null;
  recommendations: {
    explanation: string;
    immediateActions: string[];
    treatmentOptions: string[];
    bestPractices: string[];
    monitoring: string[];
  };
  classProbabilities?: Record<string, number>;
  classes?: string[];
};

@Injectable()
export class PomegranateFruitPipelineService {
  private readonly logger = new Logger(PomegranateFruitPipelineService.name);

  constructor(private readonly config: ConfigService) {}

  private mlRoot(): string {
    const configured = (this.config.get<string>('POMEGRANATE_ML_ROOT') || '').trim();
    if (configured) return configured;
    // Portable default: repo/ml/pomegranate when Nest runs from backend/
    return join(process.cwd(), '..', 'ml', 'pomegranate');
  }

  private pythonBin(): string {
    return (
      this.config.get<string>('POMEGRANATE_PYTHON') ||
      process.env.POMEGRANATE_PYTHON ||
      process.env.PYTHON ||
      'python'
    );
  }

  private inferUrl(): string {
    return (
      this.config.get<string>('POMEGRANATE_INFER_URL') ||
      process.env.POMEGRANATE_INFER_URL ||
      'http://127.0.0.1:8001'
    ).replace(/\/$/, '');
  }

  assertReady(): void {
    const root = this.mlRoot();
    const densenet = join(root, 'models', 'DenseNet_Model.keras');
    const extractor = join(root, 'models', 'feature_extractor.keras');
    const missing: string[] = [];
    if (!fs.existsSync(densenet)) missing.push(densenet);
    if (!fs.existsSync(extractor)) missing.push(extractor);
    if (missing.length) {
      throw new ServiceUnavailableException(
        `Pomegranate fruit model is not ready yet. Missing: ${missing.join('; ')}. ` +
          'Ensure DenseNet_Model.keras and feature_extractor.keras are under POMEGRANATE_ML_ROOT/models, ' +
          'or start the warm inference server (POMEGRANATE_INFER_URL).',
      );
    }
  }

  async analyzeFruitImage(imagePath: string, heatmapDir: string): Promise<FruitPipelineResult> {
    if (!fs.existsSync(imagePath)) {
      throw new BadRequestException(`Image not found: ${imagePath}`);
    }

    fs.mkdirSync(heatmapDir, { recursive: true });

    const warm = await this.analyzeViaWarmServer(imagePath, heatmapDir);
    if (warm) return warm;

    this.assertReady();
    return this.analyzeViaSpawn(imagePath, heatmapDir);
  }

  private async analyzeViaWarmServer(
    imagePath: string,
    heatmapDir: string,
  ): Promise<FruitPipelineResult | null> {
    const base = this.inferUrl();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const health = await fetch(`${base}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (!health.ok) return null;
    } catch {
      return null;
    }

    this.logger.log(`Using warm fruit inference server ${base}`);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`${base}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath, heatmapDir }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = (await res.json()) as FruitPipelineResult & { error?: string };
      if (!res.ok || data.error) {
        throw new ServiceUnavailableException(data.error || `Warm infer HTTP ${res.status}`);
      }
      if (!data.disease || typeof data.confidence !== 'number') {
        throw new ServiceUnavailableException('Warm infer response missing disease/confidence.');
      }
      return data;
    } catch (err: any) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.warn(`Warm infer failed, falling back to spawn: ${err?.message || err}`);
      return null;
    }
  }

  private async analyzeViaSpawn(imagePath: string, heatmapDir: string): Promise<FruitPipelineResult> {
    const root = this.mlRoot();
    const inferScript = join(root, 'infer.py');
    if (!fs.existsSync(inferScript)) {
      throw new ServiceUnavailableException(`Missing inference script: ${inferScript}`);
    }

    const python = this.pythonBin();
    const args = [inferScript, imagePath, '--heatmap-dir', heatmapDir];
    const env = {
      ...process.env,
      QDRANT_URL: this.config.get<string>('QDRANT_URL') || process.env.QDRANT_URL || '',
      QDRANT_API_KEY: this.config.get<string>('QDRANT_API_KEY') || process.env.QDRANT_API_KEY || '',
      QDRANT_COLLECTION:
        this.config.get<string>('QDRANT_COLLECTION') || process.env.QDRANT_COLLECTION || 'chatbot_documents',
      OPENROUTER_API_KEY:
        this.config.get<string>('OPENROUTER_API_KEY') || process.env.OPENROUTER_API_KEY || '',
      OPENROUTER_MODEL:
        this.config.get<string>('OPENROUTER_MODEL') ||
        process.env.OPENROUTER_MODEL ||
        'mistralai/mistral-7b-instruct:free',
      TF_CPP_MIN_LOG_LEVEL: '3',
      OMP_NUM_THREADS: '4',
      TF_NUM_INTRAOP_THREADS: '4',
      TF_NUM_INTEROP_THREADS: '2',
    };

    this.logger.log(`Running fruit pipeline: ${python} ${args.join(' ')}`);

    const { stdout, stderr, code } = await this.runProcess(python, args, root, env);
    if (code !== 0) {
      let detail = stderr.trim() || stdout.trim() || `exit ${code}`;
      try {
        const parsed = JSON.parse(stderr.trim() || stdout.trim());
        if (parsed?.error) detail = parsed.error;
      } catch {
        /* keep raw */
      }
      throw new ServiceUnavailableException(`Fruit AI pipeline failed: ${detail}`);
    }

    const line = stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .pop();
    if (!line) {
      throw new ServiceUnavailableException('Fruit AI pipeline returned empty output.');
    }

    let parsed: FruitPipelineResult;
    try {
      parsed = JSON.parse(line) as FruitPipelineResult;
    } catch {
      throw new ServiceUnavailableException(`Fruit AI pipeline returned non-JSON: ${line.slice(0, 200)}`);
    }

    if (!parsed.disease || typeof parsed.confidence !== 'number') {
      throw new ServiceUnavailableException('Fruit AI pipeline response missing disease/confidence.');
    }

    return parsed;
  }

  private runProcess(
    command: string,
    args: string[],
    cwd: string,
    env: NodeJS.ProcessEnv,
  ): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, env, windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('error', (err) => reject(err));
      child.on('close', (code) => resolve({ stdout, stderr, code }));
    });
  }
}
