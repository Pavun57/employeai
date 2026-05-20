import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Mail,
  Linkedin,
  Zap,
  Shield,
  GitFork,
  BarChart3,
  MessageSquare,
  Code2,
  Github,
  BookOpen,
  Terminal,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">EmployAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Agents
            </a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#setup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Self-Host
            </a>
            <a
              href="https://github.com/pavun-developer/employeai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            Open Source &middot; Self-Hosted &middot; Free Forever
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Open Source
            <br />
            <span className="text-primary">AI Agents Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Deploy AI agents that auto-reply to customer emails and generate LinkedIn posts.
            Self-host on your infrastructure. Own your data. No vendor lock-in.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Deploy Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/pavun-developer/employeai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
          </div>

          {/* Tech stack */}
          <div className="mt-16 flex items-center justify-center gap-6 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
              Next.js 15
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
              FastAPI
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
              PostgreSQL
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
              Groq / LLM
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
              Redis
            </span>
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section id="agents" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Two Focused AI Agents
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built agents that solve real problems. Not a hundred half-baked features — just two that work.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Customer Support */}
            <div className="rounded-xl border bg-card p-8 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-5">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Customer Support Agent
              </h3>
              <p className="text-muted-foreground mb-5">
                Connects to Gmail, reads incoming customer emails, and auto-replies using your knowledge base. Fully automated inbox management.
              </p>
              <ul className="text-sm space-y-2.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Gmail OAuth integration
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Knowledge base powered replies
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Auto-skips spam & notifications
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Background polling (every 2 min)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  PDF/TXT/MD file upload for KB
                </li>
              </ul>
            </div>

            {/* LinkedIn Poster */}
            <div className="rounded-xl border bg-card p-8 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-5">
                <Linkedin className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                LinkedIn Content Agent
              </h3>
              <p className="text-muted-foreground mb-5">
                Generates LinkedIn posts based on your topics and style. Posts go through an approval workflow before publishing.
              </p>
              <ul className="text-sm space-y-2.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  AI-generated post drafts
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Approve / reject workflow
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Configurable topics & tone
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Posting schedule & frequency
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  LinkedIn OAuth auto-publish
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Developers
            </h2>
            <p className="text-muted-foreground text-lg">
              Self-host in minutes. Extend with your own agents. No black boxes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GitFork className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Fully Open Source</h3>
              <p className="text-sm text-muted-foreground">
                MIT licensed. Fork it, modify it, deploy it anywhere. No usage limits, no tracking, no vendor lock-in.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">One Command Deploy</h3>
              <p className="text-sm text-muted-foreground">
                Docker Compose for local dev. Works with any PostgreSQL + Redis setup. Deploy to any cloud.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Human-in-the-Loop</h3>
              <p className="text-sm text-muted-foreground">
                LinkedIn posts require approval before publishing. You stay in control of what gets posted.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Swap Any LLM</h3>
              <p className="text-sm text-muted-foreground">
                Works with Groq, LM Studio, OpenAI, or any OpenAI-compatible API. Run fully local with Ollama.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Activity Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Every email reply and post generation is logged. Full audit trail of what your agents did and when.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Knowledge Base</h3>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, text files, or type entries manually. Your support agent uses this context to generate accurate replies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Self-Host Section */}
      <section id="setup" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Deploy in 5 Minutes
            </h2>
            <p className="text-muted-foreground text-lg">
              Clone, configure, run. That&apos;s it.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 md:p-8">
            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground select-none">$</span>
                <span>git clone https://github.com/pavun-developer/employeai.git</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground select-none">$</span>
                <span>cd employeai && cp .env.example .env</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground select-none">$</span>
                <span className="text-muted-foreground"># Fill in DATABASE_URL, REDIS_URL, GROQ_API_KEY, Google OAuth</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground select-none">$</span>
                <span>docker compose up -d</span>
              </div>
              <div className="mt-4 pt-4 border-t text-muted-foreground">
                → App running at <span className="text-foreground">http://localhost:3000</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Or run without Docker — see the{" "}
            <a
              href="https://github.com/pavun-developer/employeai#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              README
            </a>{" "}
            for manual setup.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to deploy your AI agents?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Free forever. No limits. Just fork, deploy, and go.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/pavun-developer/employeai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4" />
              View Source
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">EmployAI</span>
            <span className="text-xs text-muted-foreground ml-2">Open Source</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/pavun-developer/employeai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/pavun-developer/employeai/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Issues
            </a>
            <span className="text-sm text-muted-foreground">
              MIT License
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
