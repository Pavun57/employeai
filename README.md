# EmployAI — AI-Powered Workforce Platform

> Instantly hire AI employees for marketing, customer support, and social media.
> Connect your platforms, set goals, and let AI handle the work.

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (for local DB/Redis)

### 1. Clone and install

```bash
cd employeai

# Install frontend dependencies
cd apps/web && npm install && cd ../..

# Install backend dependencies
cd apps/api && pip install -e ".[dev]" && cd ../..
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start infrastructure

```bash
# Start PostgreSQL + Redis
docker compose up postgres redis -d
```

### 4. Run the app

```bash
# Terminal 1: Backend API
cd apps/api
uvicorn app.main:app --reload --port 8000

# Terminal 2: Celery worker
cd apps/api
celery -A app.worker worker --loglevel=info

# Terminal 3: Frontend
cd apps/web
npm run dev
```

### 5. Open in browser

- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

## Architecture

```
apps/web        → Next.js 15 frontend (React, Tailwind, shadcn/ui)
apps/api        → FastAPI backend (Python, LangGraph, Celery)
packages/database → SQL migrations and schema
```

## AI Employees (MVP)

| Role | Capabilities |
|------|-------------|
| Digital Marketing Manager | Email campaigns, ad copy, content strategy |
| Customer Support Executive | Auto-reply, ticket management, escalation |
| Social Media Manager | Content creation, scheduling, engagement |

## Integrations

- **Gmail** — Email automation (OAuth 2.0)
- **Instagram** — DMs, posts, comments (Meta Business API)
- **LinkedIn** — Content publishing (OAuth 2.0)
- **Shopify** — Order/product data access (App OAuth)

## LLM Configuration

Supports any OpenAI-compatible API:

```env
# Use Grok
LLM_PROVIDER=grok
GROK_API_KEY=your-key
GROK_BASE_URL=https://api.x.ai/v1

# Use LM Studio (local)
LLM_PROVIDER=lmstudio
LLM_BASE_URL=http://localhost:1234/v1
LLM_MODEL=default
```

## Admin Panel

Access at `/admin` (requires admin role). Features:
- User management (roles, activation)
- Subscription control (free/pro/enterprise toggle)
- System logs and observability
- Platform-wide statistics

## License

Proprietary — All rights reserved.
