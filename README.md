# EcoConnect

> Civic grievance reporting and municipal accountability platform.

EcoConnect is a full-stack civic intelligence system for collecting evidence-backed environmental and infrastructure complaints, grouping related reports, prioritizing issues, routing them to responsible officials, and tracking resolution with citizen verification.

The project combines a citizen-facing reporting workflow with an official operations dashboard and asynchronous AI/background processing.

## What It Does

- **Evidence-backed reporting** — location, category, description, and photo/video evidence.
- **Multimodal AI triage** — Gemini analyzes submitted evidence and extracts structured issue information.
- **Issue clustering** — related reports can be grouped using geographic constraints and pgvector similarity search.
- **Deterministic prioritization** — safety, severity, environmental impact, population affected, and geographic spread contribute to auditable priority decisions.
- **Official operations dashboard** — triage, SLA tracking, acceptance/rejection, routing, resolution submission, and dispute handling.
- **Citizen verification** — reporters can confirm or dispute a submitted resolution during the verification window.
- **Community signals** — users can indicate whether they are experiencing an issue, with server-side voting constraints.
- **Security controls** — Zod validation, JWT authentication, RBAC, rate limiting, CORS controls, Helmet, and audit logging.
- **Background processing** — BullMQ workers handle AI, SLA, verification, and notification workloads asynchronously.

## Architecture

```text
                         ┌─────────────────────┐
                         │   Next.js Frontend   │
                         │ Citizen + Official   │
                         │       Port 3000      │
                         └──────────┬──────────┘
                                    │ HTTP API
                                    ▼
                         ┌─────────────────────┐
                         │   Express Backend   │
                         │     TypeScript      │
                         │       Port 4000      │
                         └──────┬──────┬────────┘
                                │      │
                   ┌────────────┘      └──────────────┐
                   ▼                                   ▼
          ┌─────────────────┐                 ┌─────────────────┐
          │   PostgreSQL    │                 │ Redis + BullMQ  │
          │    + pgvector   │                 │ Background Jobs │
          └─────────────────┘                 └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   AI / Worker   │
                                               │ Gemini + Tasks  │
                                               └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Leaflet, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma, pgvector |
| Background jobs | Redis, BullMQ |
| AI | Google Gemini multimodal API + embeddings |
| Validation | Zod, shared TypeScript schemas |
| Testing | Vitest |
| Monorepo | Turborepo, npm workspaces |

## Repository Structure

```text
Eco-connect/
├── frontend/                 # Next.js application
│   ├── app/                  # Citizen and official routes
│   ├── components/           # Reusable UI components
│   └── public/               # Static assets
├── backend/                  # Express API and workers
│   ├── prisma/               # Database schema
│   └── src/
│       ├── controllers/      # Request handlers
│       ├── lib/              # Prisma, Redis, Gemini, email, identity
│       ├── middleware/       # Auth, RBAC, validation, rate limiting, audit
│       ├── routes/           # API routes
│       ├── services/         # Domain/application services
│       ├── tests/            # Automated tests
│       └── workers/          # Asynchronous processing
└── packages/
    └── types/                # Shared schemas and TypeScript types
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL with the `pgvector` extension
- Redis
- A Gemini API key for AI-enabled operation

### Install

```bash
git clone https://github.com/Weirdgamer20/Eco-connect.git
cd Eco-connect
npm install
```

### Configure the environment

Copy the example configuration:

```bash
cp .env.example .env
```

At minimum, configure:

```text
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
```

For AI-enabled operation, also configure:

```text
GEMINI_API_KEY
```

**Never commit `.env` or real credentials.** The backend validates required authentication/database configuration at startup and requires the Gemini key for production operation.

### Database

```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

### Run tests

```bash
npm run test
```

### Run locally

```bash
npm run dev
```

Default development endpoints:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Official dashboard: `http://localhost:3000/official`

## Security Model

EcoConnect treats the backend as the trust boundary. Client input is validated server-side and authorization is enforced through authentication and RBAC middleware.

Key controls include:

- JWT access and refresh tokens
- server-side Zod validation
- role-based authorization
- request rate limiting
- Helmet security headers
- restricted CORS configuration
- audit logging for important operations
- environment-based secret configuration
- asynchronous job processing through Redis/BullMQ

Secrets are intentionally not stored in the repository. Production deployments must provide their credentials through the deployment environment or a dedicated secret manager.

## Design Notes

### AI is an analysis component, not the source of truth

Gemini assists with multimodal evidence analysis, classification, and embeddings. Deterministic application rules remain responsible for priority calculations and other auditable workflow decisions.

### Vector search is combined with geographic constraints

Issue clustering is not treated as pure semantic similarity. Geographic context is part of the decision process so unrelated reports in different locations are less likely to be grouped together.

### Resolution requires citizen verification

An official resolution does not automatically mean the underlying issue is accepted as resolved. The workflow provides a verification period during which reporting citizens can confirm or dispute the result.

## Current Scope

EcoConnect is a portfolio/research implementation of a civic accountability workflow. External municipal integrations, identity providers, SMS providers, and cloud storage can be configured separately from the core application.

## License

MIT License.
