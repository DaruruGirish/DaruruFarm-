# Daruru Farm

Farm operations portal for **Daruru Farms** — track holdings, expenses, daily work, gallery photos, weather-based disease risk, and **AI fruit disease detection** for pomegranate.

---

## What you get

| Area | What it does |
|------|----------------|
| **Auth & roles** | Register / login (JWT), owner & farm users |
| **Farms** | Holdings with location (used for weather) |
| **Expenses & daily logs** | Day-to-day farm bookkeeping |
| **Gallery** | Photo uploads |
| **Disease risk** | Bacterial blight risk from live Open-Meteo weather |
| **Fruit AI** | DenseNet121 + Grad-CAM++ + HBDS severity on fruit photos |
| **Billing** | Razorpay premium (optional; needs keys) |

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React (nginx in production) |
| Backend | NestJS (Node / TypeScript) |
| Database | MySQL 8 |
| ML | Python, TensorFlow **2.17** / Keras 3, Flask warm server |
| Local / cloud run | Docker Compose |
| Cloud | AWS (EC2, RDS, ECR, S3, Secrets Manager), Terraform in `infrastructure/` |
| CI/CD | GitHub Actions → build → ECR → SSM deploy on EC2 |

---

## Repo layout

```
DaruruFarm/
├── frontend/           # React UI
├── backend/            # NestJS API
├── ml/pomegranate/     # Fruit disease inference (Docker image)
├── infrastructure/     # Terraform (current AWS stack)
├── scripts/
│   ├── aws-free-tier-stop.sh   # Stop EC2 + RDS when idle
│   └── dev-seed/               # Local demo data only
├── docker-compose.yml  # frontend + backend + ml + mysql
└── .github/workflows/  # CI/CD
```

---

## Quick start (local)

### Option A — Docker (closest to cloud)

Needs **Docker Desktop**.

```bash
cp .env.docker.example .env   # optional overrides
docker compose up --build
```

- App: http://localhost:80  
- API (direct): http://localhost:3000  
- ML health (inside compose network): `http://ml:8001/health`

Stop:

```bash
docker compose down
```

### Option B — Node + local MySQL

**Need:** Node.js 20+, MySQL 8 with database `daruru_farm`.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` (DB, JWT, optional Razorpay / Google).

```bash
# Terminal 1 — API
cd backend && npm ci && npm run start

# Terminal 2 — UI
cd frontend && npm ci && npm run dev
```

- UI: http://localhost:5173 (proxies `/api` → backend)  
- API: http://localhost:3000  

Optional warm ML server (for fruit analyze without Docker):

```bash
cd ml/pomegranate
pip install -r requirements.txt   # or use the Docker image
python serve.py
```

Set in `backend/.env`:

```env
POMEGRANATE_INFER_URL=http://127.0.0.1:8001
```

### Local demo data (optional)

Only for **local** UI testing. Never runs in production.

```bash
cd backend
npm run seed:dev
```

Details: [`scripts/dev-seed/README.md`](scripts/dev-seed/README.md).

---

## Fruit disease AI

Pipeline: **DenseNet121** classification → **Grad-CAM++** heatmap → **HBDS** severity.

Classes: Alternaria, Anthracnose, Bacterial_Blight, Cercospora, Healthy.

| API | Purpose |
|-----|---------|
| `POST /api/disease-management/analyze-fruit` | Upload a fruit photo |
| `POST /api/disease-management/analyze-gallery/:id` | Analyze an existing gallery image |
| `POST /api/disease-management/predict` | Weather-based bacterial blight risk |

Models live under `ml/pomegranate/models/`. The Docker image uses **TensorFlow 2.17** so Keras 3 `.keras` files load correctly (TF 2.15 cannot load them).

More detail: [`ml/pomegranate/README.md`](ml/pomegranate/README.md).

---

## AWS cloud (current setup)

Region: **`ap-south-2`**. Project name: **`darurufarm`**.

### What is deployed

- **EC2** — Docker Compose: frontend (port 80), backend, ML  
- **RDS MySQL** — app database (separate from your laptop DB)  
- **ECR** — `darurufarm-frontend`, `darurufarm-backend`, `darurufarm-ml`  
- **S3** — uploads  
- **Secrets Manager** — runtime secrets  
- **No ALB / no Elastic IP / no NAT** — keeps free-tier cost down  

Terraform: `infrastructure/` (apply from there with your AWS credentials).

### Important: cloud ≠ local

- Cloud RDS starts **empty**. Local users/passwords do **not** work there.  
- Register a new account on the cloud URL, or use the account you created during smoke tests.  
- Public IP **changes** every time you stop/start EC2 (no Elastic IP).

### Start when you need the app

1. Start **RDS** → wait until status is `available`  
2. Start **EC2** → wait until `running`  
3. Get the public IP:

```bash
aws ec2 describe-instances --region ap-south-2 \
  --filters "Name=tag:Name,Values=darurufarm-prod-ec2" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text
```

4. Open: **`http://YOUR-NEW-IP/`**  
   - Prefer **http://**  
   - If you use https with the optional host certificate, accept the browser warning  

Docker images and RDS data remain after stop/start. App comes back with the new IP.

Instance id (current): `i-0c587abc23e013ce4`  
RDS id: `darurufarm-prod-mysql`

### Stop when you are done (saves money)

```bash
# Git Bash / WSL / macOS / Linux
export AWS_REGION=ap-south-2
./scripts/aws-free-tier-stop.sh
```

Or with AWS CLI:

```bash
aws ec2 stop-instances --region ap-south-2 --instance-ids i-0c587abc23e013ce4
aws rds stop-db-instance --region ap-south-2 --db-instance-identifier darurufarm-prod-mysql
```

Always start **RDS before EC2** next time so the API can connect to the database.

### Deploy updates

Push to **`main`**. GitHub Actions:

1. Builds frontend / backend / ML  
2. Pushes images to ECR  
3. Runs SSM deploy on the EC2 (`darurufarm-deploy`) — pull + `docker compose up` + frontend restart  

Required GitHub **variables**: `AWS_REGION`, `PROJECT_NAME`, `RDS_INSTANCE_ID`  
Required GitHub **secrets**: AWS keys, `EC2_INSTANCE_ID`

---

## Testing

```bash
cd backend && npm run test
cd frontend && npm run test
```

---

## Environment & secrets

Never commit real `.env` files.

| File | Use |
|------|-----|
| `.env.example` | Root template |
| `.env.docker.example` | Docker Compose defaults |
| `backend/.env.example` | Nest API |
| `frontend/.env.example` | Vite |

Typical keys: `DB_*`, `JWT_SECRET`, `RAZORPAY_*`, `GOOGLE_CLIENT_ID`, `POMEGRANATE_INFER_URL`.

---

## Troubleshooting (cloud)

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Site can’t be reached | EC2 stopped, or wrong/old IP | Start EC2 + RDS; use **new** public IP |
| Login fails | Cloud DB is separate from local | Register again on cloud, or use a cloud-created user |
| Disease analyze fails / ML unhealthy | Old ML image (Keras mismatch) or ML still loading | Wait ~1–2 min after start; check `docker compose logs ml` on the instance |
| API 502 after redeploy | Frontend nginx cached old backend IP | Deploy script restarts frontend; or `docker compose restart frontend` on EC2 |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License / project

Private Daruru Farms application. Coordinate with the repo owner before sharing credentials or opening the cloud instance publicly for long periods.
