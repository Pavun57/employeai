# EmployAI — AI Email Auto-Reply & LinkedIn Auto-Poster

> Two focused AI agents: one auto-replies to customer emails using your knowledge base,
> the other generates and publishes LinkedIn posts on your schedule with an approval workflow.

## What It Does

### 1. Customer Support Agent (Gmail Auto-Reply)
- Connect your Gmail account
- Build a Knowledge Base (FAQs, product info, policies)
- Activate the agent — incoming inquiry emails get AI-generated replies based on your KB
- Skips automated/noreply emails, logs all conversations

### 2. LinkedIn Content Agent (Auto-Poster)
- Connect your LinkedIn account
- Configure topics, posting style, tone, and frequency
- AI generates post drafts using Groq LLM
- Review drafts in the Post Drafts page — approve, edit, or reject
- Approved posts are published to LinkedIn automatically

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL (or Supabase)
- Redis (or Upstash)

### 1. Install

```bash
cd employeai

# Frontend
cd apps/web && npm install && cd ../..

# Backend
cd apps/api && pip install -e ".[dev]" && cd ../..
```

### 2. Set up environment

```bash
cp .env.example .env
# Fill in: DATABASE_URL, REDIS_URL, GROQ_API_KEY, Google OAuth, LinkedIn OAuth
```

### 3. Run migrations

```bash
psql $DATABASE_URL < packages/database/migrations/001_init.sql
psql $DATABASE_URL < packages/database/migrations/002_pivot_two_agents.sql
```

### 4. Run the app

```bash
# Terminal 1: Backend API
cd apps/api
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd apps/web
npm run dev
```

### 5. Open in browser

- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/docs

## Architecture

```
apps/web          → Next.js 15 (App Router, React 19, Tailwind, shadcn/ui)
apps/api          → FastAPI (async SQLAlchemy, Groq LLM, Gmail/LinkedIn APIs)
packages/database → SQL migrations
```

## AI Agents

| Agent | Platform | What It Does |
|-------|----------|-------------|
| Customer Support | Gmail | Reads unread emails → generates reply from KB → sends reply |
| LinkedIn Poster | LinkedIn | Generates posts from topics → sends for approval → publishes |

## Integrations

- **Gmail** — OAuth 2.0 (read inbox, send replies)
- **LinkedIn** — OAuth 2.0 (publish posts via UGC API)

## Key Pages

| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview with agent status + quick actions |
| `/dashboard/employees` | Create and manage AI agents |
| `/dashboard/knowledge-base` | CRUD for support agent's FAQ/knowledge |
| `/dashboard/post-drafts` | Approve/reject/edit LinkedIn post drafts |
| `/dashboard/integrations` | Connect Gmail and LinkedIn |
| `/dashboard/activity` | Task history and logs |

## LLM Configuration

Uses Groq (Llama 3.3 70B) by default. Supports any OpenAI-compatible API:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your-key
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Or use LM Studio (local)
LLM_PROVIDER=lmstudio
LLM_BASE_URL=http://localhost:1234/v1
```

## API Endpoints

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login, profile |
| `/api/agents` | Agent CRUD, LinkedIn config, generate posts, run |
| `/api/knowledge-base` | Knowledge base CRUD + categories |
| `/api/post-drafts` | Draft list, approve, reject, edit |
| `/api/integrations` | OAuth flows, list/disconnect platforms |
| `/api/tasks` | Task history |
| `/api/admin` | User/subscription management |

## License

Proprietary — All rights reserved.
