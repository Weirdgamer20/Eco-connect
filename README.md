# EcoConnect 🌿

> **Civic Grievance Reporting & Municipal Accountability Platform**
> Community-first civic reporting, multimodal AI triage, and public accountability tracking.

EcoConnect empowers citizens to report civic problems (pollution, road damage, waste burning, water contamination) with media evidence, while leveraging multimodal AI (Google Gemini) to cluster reports into canonical civic issues, route them to responsible municipal authorities, and track resolution through SLA compliance and community verification.

---

## Key Features

- **5-Step Grievance Flow**: GPS pinpointing with interactive Leaflet map, category classification (25+ environmental categories), photo/video evidence upload, and pre-submission summary.
- **AI Multimodal Evidence Engine**: Google Gemini multimodal analysis extracts categories, verifies media consistency, evaluates severity, and generates text embeddings.
- **Civic Issue Clustering**: Deduplicates and clusters reports within geographic boundaries via pgvector similarity search.
- **Deterministic Priority Rules**: Multi-factor scoring (safety, environmental impact, population affected, geographic spread, severity) mapping issues into P1/P2/P3/P4 bands with auditable decision logs.
- **Desktop-First Official Dashboard**: Municipal command center for triage, SLA compliance, issue acceptance, auto-rerouting on rejection, resolution submission, and dispute logging.
- **48-Hour Citizen Verification Window**: When marked resolved, reporting citizens confirm fixes or dispute with proof, ensuring genuine accountability.
- **Swipe-Based Community Engagement**: Public feed featuring swipe gestures ("Experiencing" / "Not experiencing") and accessible voting buttons (1 vote per user constraint).
- **Security & RBAC**: Strict Zod input validation, JWT token rotation, rate limiting, and immutable audit logs.

---

## Tech Stack

- **Monorepo**: Turborepo, npm workspaces
- **Frontend**: Next.js 15 (App Router), React 19, Vanilla CSS (custom design system tokens), Framer Motion, Leaflet
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (with pgvector)
- **Workers**: BullMQ, Redis
- **AI**: Google Gemini (1.5 Pro multimodal & text-embedding-004)
- **Validation & Types**: Zod, TypeScript shared schemas (`@ecoconnect/types`)
- **Testing**: Vitest (18 automated unit tests)

---

## Repository Structure

```
├── packages/
│   └── types/           # Shared Zod validation schemas & TypeScript types
├── backend/             # Express API server + BullMQ background workers
│   ├── prisma/          # Prisma schema & PostgreSQL definitions
│   └── src/
│       ├── controllers/
│       ├── lib/         # Gemini, Redis, Prisma, Email, Identity
│       ├── middleware/  # Auth, RBAC, Rate Limiting, Audit Logger
│       ├── routes/      # Auth, Grievances, Issues, Official, Notifications
│       ├── services/    # Issue, Priority, Routing, Resolution, Auth
│       ├── tests/       # Vitest unit test suites
│       └── workers/     # AI, SLA, Verification, Notification workers
└── frontend/            # Next.js 15 App Router web application
    ├── app/             # Citizen pages + /official administration dashboard
    ├── components/      # UI components (AppShell, Map, Badges, Cards, Timeline)
    └── public/          # Assets and icons
```

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL (with pgvector extension enabled)
- Redis

### Installation

```bash
# Clone the repository
git clone https://github.com/Weirdgamer20/Eco-connect.git
cd Eco-connect

# Install dependencies across all workspaces
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your secrets (DATABASE_URL, REDIS_URL, GEMINI_API_KEY, JWT_SECRET).

### Database Setup

```bash
cd backend
npx prisma generate
npx prisma db push
```

### Running Tests

```bash
npm run test
```

### Running the Application

```bash
# Start both frontend and backend concurrently via Turborepo
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:4000](http://localhost:4000)
- Official Portal: [http://localhost:3000/official](http://localhost:3000/official)

---

## License

MIT License. Developed for Civic Innovation & Public Governance.
