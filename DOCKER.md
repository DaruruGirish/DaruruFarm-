# Docker (Daruru Farms)

## Services
| Service | Image / build | Port |
|---------|---------------|------|
| `frontend` | Vite build + nginx | **8080** → 80 |
| `backend` | NestJS | **3000** |
| `ml` | TensorFlow + Flask (`serve.py`) | internal **8001** |
| `db` | MySQL 8.4 | **3306** |

## Quick start
```bash
cp .env.docker.example .env
# Edit .env — set JWT_SECRET, RAZORPAY_*, GOOGLE_* as needed

docker compose up --build
```

Open: http://localhost:8080  
API (direct): http://localhost:3000  

## Notes
- Fruit AI uses warm ML at `http://ml:8001`. Backend and ML share the `daruru_uploads` volume so image paths and Grad-CAM heatmaps match.
- First boot sets `TYPEORM_SYNCHRONIZE=true` so tables are created. Set to `false` after schema is stable.
- ML image is large (TensorFlow CPU). First build can take a long time and needs several GB of disk/RAM.
- Do not bake secrets into Dockerfiles; pass them via `.env` / Compose environment.

## Rebuild one service
```bash
docker compose build backend
docker compose up -d backend
```
