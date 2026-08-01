# Contributing to Daruru Farm

We welcome contributions! Please follow these guidelines:

## Code Style
- **TypeScript** – use `eslint` and `prettier` (already configured in both `backend` and `frontend`).
- **Commit messages** – follow the conventional commits format (`feat:`, `fix:`, `docs:`, etc.).
- **Branch naming** – `feature/<name>`, `bugfix/<name>`, `chore/<name>`.

## Development Workflow
1. Fork the repository and clone your fork.
2. Create a new branch for your change.
3. Install dependencies:
   ```bash
   cd backend && npm ci
   cd ../frontend && npm ci
   ```
4. Run linting and tests before committing:
   ```bash
   npm run lint
   npm run test
   ```
5. Push your branch and open a Pull Request targeting `main`.

## Testing
- **Backend**: `npm run test` (Jest) inside `backend`.
- **Frontend**: `npm run test` (Vite test runner) inside `frontend`.

## CI/CD
All PRs trigger the GitHub Actions workflow. Ensure the pipeline passes before merging.

## Secrets
Never commit real secrets. Use the `.env.example` template and load real values from a secure store (AWS Secrets Manager, GitHub Secrets, etc.).
