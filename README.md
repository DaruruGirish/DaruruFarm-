# Daruru Farm

**Daruru Farm** is a full‑stack application for managing farm operations. It consists of:

- **Backend** – NestJS API (Node.js, TypeScript) with MySQL.
- **Frontend** – Vite + React UI.
- **Infrastructure** – Terraform (AWS) and Docker Compose for local development.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment (Terraform)](#deployment-terraform)
- [CI/CD](#cicd)
- [Contributing](#contributing)

## Prerequisites
- **Docker Desktop** (or Docker Engine) – required for `docker compose`.
- **Node.js 22** (recommended) – for backend/frontend tooling.
- **Terraform 1.x** – for provisioning AWS resources.
- **AWS CLI** with credentials that have permission to manage the resources (ECR, RDS, EC2, etc.).

## Environment Configuration
Copy the example files and fill in real values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The `.env` file contains non‑secret placeholders. Secrets (DB passwords, JWT secret) must be stored securely (e.g., AWS Secrets Manager) and referenced via environment variables.

## Running the Application Locally
```bash
# From the repository root
docker compose up --build
```

- MySQL will be available at `localhost:3306`.
- Backend API runs on `http://localhost:3000`.
- Frontend UI is served on `http://localhost`.

Health check endpoint (backend):
```bash
curl http://localhost:3000/health
```

## Testing
```bash
# Backend tests
cd backend && npm run test

# Frontend tests
cd frontend && npm run test
```

## Deployment (Terraform)
```bash
cd DaruruFarm-Infrastructure
terraform init
terraform fmt -check
terraform validate
terraform plan   # review changes
terraform apply   # provision resources
```

After provisioning, push Docker images to ECR and run the `deploy` job in GitHub Actions (or SSH into your EC2 instance and run `docker compose pull && docker compose up -d`).

## CI/CD
The repository includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that:

1. Lints and builds both backend and frontend.
2. Builds and pushes Docker images to Amazon ECR.
3. Deploys the stack to an EC2 instance via SSH.

## Contributing
Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on coding standards, branch naming, and pull‑request workflow.
