<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/python-3.11+-blue.svg" alt="Python" />
  <img src="https://img.shields.io/badge/next.js-15-black.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/fastapi-0.115+-green.svg" alt="FastAPI" />
</p>

# EmployAI — Open Source AI Agents Platform

> Self-hosted AI agents that auto-reply to customer emails and generate LinkedIn posts. Own your data. No vendor lock-in.

EmployAI gives you two focused AI agents you can deploy on your own infrastructure:

1. **Customer Support Agent** — connects to Gmail, reads incoming emails, and auto-replies using your uploaded knowledge base
2. **LinkedIn Content Agent** — generates post drafts based on your topics/tone, with an approval workflow before publishing

---

## Features

- **Gmail Auto-Reply** — Background polling every 2 minutes. Reads unread emails, generates context-aware replies from your knowledge base, sends them, and logs everything.
- **LinkedIn Post Generation** — AI drafts posts based on configurable topics, style, tone, and frequency. Approve or reject before publishing.
- **Knowledge Base** — Upload PDFs, TXT, or Markdown files. Or type entries manually. The support agent uses this context.
- **Human-in-the-Loop** — LinkedIn posts require explicit approval. You stay in control.
- **Swap Any LLM** — Works with Groq (cloud), LM Studio (local), OpenAI, or any OpenAI-compatible API.
- **Activity Tracking** — Full audit trail of every email reply and post generated.
- **OAuth Integrations** — Gmail and LinkedIn OAuth 2.0 flows built in.
- **Multi-tenant** — Organization-based data isolation. Each signup creates an isolated workspace.
- **Background Workers** — asyncio-based polling loop runs inside the FastAPI process. No Celery needed.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.11+, async SQLAlchemy |
| Database | PostgreSQL (Supabase or self-hosted) |
| Cache/Queue | Redis (Upstash or self-hosted) |
| LLM | Groq / LM Studio / OpenAI-compatible |
| Auth | JWT (python-jose) + bcrypt |
| Monorepo | Turborepo + npm workspaces |

---

## Architecture

```
employeai/
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/
│   │   │   ├── agents/       # Agent orchestration logic
│   │   │   ├── api/routes/   # REST endpoints
│   │   │   ├── core/         # Config, auth, database
│   │   │   ├── integrations/ # Gmail, LinkedIn OAuth
│   │   │   ├── llm/          # LLM provider abstraction
│   │   │   ├── models/       # SQLAlchemy models
│   │   │   ├── services/     # Gmail service, LinkedIn service
│   │   │   ├── main.py       # App entry + background polling
│   │   │   └── worker.py     # Task worker
│   │   └── pyproject.toml
│   └── web/                  # Next.js frontend
│       ├── src/
│       │   ├── app/          # App Router pages
│       │   ├── lib/          # API client, utilities
│       │   └── types/        # TypeScript types
│       └── package.json
├── packages/
│   └── database/
│       └── migrations/       # SQL migration files
├── docker-compose.yml
├── turbo.json
└── .env.example
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ (or a Supabase project)
- Redis (or Upstash)
- A Groq API key (free tier: https://console.groq.com) or local LM Studio

### 1. Clone & Install

```bash
git clone https://github.com/pavun-developer/employeai.git
cd employeai

# Frontend dependencies
cd apps/web && npm install && cd ../..

# Backend dependencies
cd apps/api && python -m venv venv && source venv/bin/activate
pip install -e ".[dev]" && cd ../..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in the required values:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/employeai

# Redis
REDIS_URL=redis://localhost:6379/0

# LLM (pick one)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here

# OR for local LLM:
# LLM_PROVIDER=lmstudio
# LLM_BASE_URL=http://localhost:1234/v1

# Google OAuth (for Gmail agent)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/integrations/oauth/gmail/callback

# LinkedIn OAuth (for LinkedIn agent)
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8000/api/integrations/oauth/linkedin/callback

# App secrets
SECRET_KEY=generate-a-random-64-char-string
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Database Migrations

```bash
# Using psql directly:
psql $DATABASE_URL -f packages/database/migrations/001_init.sql
psql $DATABASE_URL -f packages/database/migrations/002_pivot_two_agents.sql
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend
cd apps/api && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd apps/web
npm run dev
```

App is now running at **http://localhost:3000**

### 5. Docker (Alternative)

```bash
docker compose up -d
```

---

## Google OAuth Setup (Gmail Agent)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable the **Gmail API**
3. Create OAuth 2.0 credentials (Web Application)
4. Set authorized redirect URI to: `http://localhost:8000/api/integrations/oauth/gmail/callback`
5. Copy Client ID and Client Secret to your `.env`
6. Add the required scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`

---

## LinkedIn OAuth Setup (LinkedIn Agent)

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create an app → Request the following products:
   - **Share on LinkedIn**
   - **Sign In with LinkedIn using OpenID Connect**
3. Set redirect URI: `http://localhost:8000/api/integrations/oauth/linkedin/callback`
4. Copy Client ID and Client Secret to your `.env`

---

## Usage

### Customer Support Agent

1. Register an account at `http://localhost:3000/register`
2. Go to **AI Agents** → Hire a **Customer Support Agent**
3. Connect your Gmail account (OAuth flow)
4. Upload your knowledge base (PDFs, text files, or manual entries)
5. Activate the agent — it starts polling Gmail every 2 minutes

The agent will:
- Fetch unread emails from your primary inbox
- Skip spam, newsletters, and noreply addresses
- Generate replies using your knowledge base as context
- Send replies and mark emails as read
- Log all activity in the Activity tab

### LinkedIn Content Agent

1. Hire a **LinkedIn Content Agent**
2. Connect your LinkedIn account (OAuth flow)
3. Configure topics, posting style, tone, and frequency
4. Click **Generate Post** to create drafts
5. Review drafts in the **Post Drafts** tab — approve, reject, or delete
6. Approved posts are published to your LinkedIn profile

---

## LLM Configuration

EmployAI supports multiple LLM backends:

| Provider | Config | Notes |
|----------|--------|-------|
| **Groq** | `LLM_PROVIDER=groq` + `GROQ_API_KEY` | Fast, free tier available. Default model: `llama-3.3-70b-versatile` |
| **LM Studio** | `LLM_PROVIDER=lmstudio` + `LLM_BASE_URL=http://localhost:1234/v1` | Fully local, no API key needed |
| **OpenAI** | `LLM_PROVIDER=openai_compatible` + `LLM_BASE_URL` + `LLM_API_KEY` | Works with any OpenAI-compatible API |
| **Ollama** | `LLM_PROVIDER=openai_compatible` + `LLM_BASE_URL=http://localhost:11434/v1` | Local via Ollama's OpenAI compatibility |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account + org |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user profile |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents/` | List agents |
| POST | `/api/agents/` | Create agent (plan-limited) |
| GET | `/api/agents/:id` | Get agent details |
| PATCH | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent + all data |
| POST | `/api/agents/:id/run` | Trigger inbox processing |
| POST | `/api/agents/:id/generate-post` | Generate LinkedIn draft |
| PUT | `/api/agents/:id/linkedin-config` | Update LinkedIn config |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge-base/` | List entries |
| POST | `/api/knowledge-base/` | Create entry |
| POST | `/api/knowledge-base/upload` | Upload PDF/TXT/MD file |
| PATCH | `/api/knowledge-base/:id` | Update entry |
| DELETE | `/api/knowledge-base/:id` | Delete entry |

### Post Drafts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/post-drafts/` | List drafts |
| POST | `/api/post-drafts/:id/approve` | Approve & publish |
| POST | `/api/post-drafts/:id/reject` | Reject draft |
| PATCH | `/api/post-drafts/:id` | Edit draft content |
| DELETE | `/api/post-drafts/:id` | Delete draft |

### Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/` | List connected platforms |
| GET | `/api/integrations/oauth/:platform/authorize` | Start OAuth flow |
| DELETE | `/api/integrations/:id` | Disconnect platform |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | List tasks (filterable) |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `SECRET_KEY` | Yes | JWT signing secret (random string) |
| `LLM_PROVIDER` | Yes | `groq`, `lmstudio`, or `openai_compatible` |
| `GROQ_API_KEY` | If Groq | Groq API key |
| `LLM_BASE_URL` | If local | Base URL for LM Studio / Ollama |
| `LLM_API_KEY` | If needed | API key for OpenAI-compatible providers |
| `LLM_MODEL` | No | Model name (default: `llama-3.3-70b-versatile` for Groq) |
| `GOOGLE_CLIENT_ID` | For Gmail | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Gmail | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | For Gmail | OAuth callback URL |
| `LINKEDIN_CLIENT_ID` | For LinkedIn | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | For LinkedIn | LinkedIn OAuth client secret |
| `LINKEDIN_REDIRECT_URI` | For LinkedIn | OAuth callback URL |
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_APP_URL` | No | Frontend URL (default: `http://localhost:3000`) |

---

## Deployment

### Railway / Render / Fly.io

1. Push to GitHub
2. Connect repo to your platform
3. Set environment variables
4. Deploy backend as a web service (Python, port 8000)
5. Deploy frontend as a web service (Node.js, port 3000)
6. Use a managed PostgreSQL + Redis

### VPS (Ubuntu)

```bash
# Clone and setup
git clone https://github.com/pavun-developer/employeai.git
cd employeai && cp .env.example .env
# Edit .env with production values

# Run with Docker
docker compose -f docker-compose.yml up -d

# Or with systemd services for API + Next.js
```

---

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `cd apps/api && pytest` / `cd apps/web && npm run lint`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Development Tips

- Backend auto-reloads with `--reload` flag
- Frontend has Fast Refresh via Next.js
- Database models are in `apps/api/app/models/`
- To add a new agent type, create a new service in `apps/api/app/services/`
- API routes are in `apps/api/app/api/routes/`

---

## Roadmap

- [ ] Instagram DM agent
- [ ] Shopify order lookup integration
- [ ] Scheduled post publishing (cron-based)
- [ ] Multi-user teams within an org
- [ ] Webhook support for real-time Gmail (push notifications)
- [ ] Agent analytics dashboard
- [ ] Custom system prompts per agent
- [ ] Email template builder

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

Built by [@pavun-developer](https://github.com/pavun-developer)

If this project helped you, give it a ⭐ on GitHub!
