import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Mail,
  Instagram,
  Linkedin,
  ShoppingBag,
  Zap,
  Shield,
  Users,
  BarChart3,
  MessageSquare,
  Megaphone,
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
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#employees" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              AI Employees
            </a>
            <a href="#integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Integrations
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
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
            <Zap className="h-3.5 w-3.5 text-primary" />
            AI Employees that work 24/7
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Hire AI Employees
            <br />
            <span className="text-primary">Not More Software</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Stop learning complicated tools. Hire AI employees for marketing,
            customer support, and social media. They connect to your platforms
            and start working immediately.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              Watch Demo
            </a>
          </div>

          {/* Platform logos */}
          <div className="mt-16 flex items-center justify-center gap-8 opacity-60">
            <Mail className="h-6 w-6" />
            <Instagram className="h-6 w-6" />
            <Linkedin className="h-6 w-6" />
            <ShoppingBag className="h-6 w-6" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Connects with Gmail, Instagram, LinkedIn, and Shopify
          </p>
        </div>
      </section>

      {/* AI Employees Section */}
      <section id="employees" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your AI Workforce
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose specialized AI employees that understand your business goals
              and execute tasks autonomously.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Marketing Manager */}
            <div className="group relative rounded-xl border bg-card p-6 hover:shadow-lg hover:border-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Digital Marketing Manager
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Creates email campaigns, writes ad copy, plans content
                calendars, and optimizes your marketing strategy.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Email campaign automation
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Ad copy & content creation
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Weekly performance reports
                </li>
              </ul>
            </div>

            {/* Customer Support */}
            <div className="group relative rounded-xl border bg-card p-6 hover:shadow-lg hover:border-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Customer Support Executive
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Responds to customer queries instantly via email and DMs,
                categorizes tickets, and escalates when needed.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Auto-reply to queries
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Smart ticket categorization
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Shopify order lookup
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div className="group relative rounded-xl border bg-card p-6 hover:shadow-lg hover:border-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                <Instagram className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Social Media Manager
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Creates content, schedules posts, responds to engagement, and
                researches trending hashtags.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  Content creation & scheduling
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  Engagement & reply management
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  Hashtag & trend research
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
              Why EmployAI?
            </h2>
            <p className="text-muted-foreground text-lg">
              Built for businesses that want results, not complexity.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Instant Setup</h3>
              <p className="text-sm text-muted-foreground">
                Choose an AI employee, connect your platforms, and they start
                working in minutes. No technical skills needed.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Human-in-the-Loop</h3>
              <p className="text-sm text-muted-foreground">
                Review and approve sensitive actions before they execute. Stay in
                control while AI does the heavy lifting.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Your AI employees work together — marketing insights feed into
                social media, support data improves messaging.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Real-Time Activity</h3>
              <p className="text-sm text-muted-foreground">
                See exactly what your AI employees are doing with a live activity
                feed and detailed task history.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Learns & Improves</h3>
              <p className="text-sm text-muted-foreground">
                AI employees learn from your business context, past interactions,
                and feedback to get better over time.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Platform Native</h3>
              <p className="text-sm text-muted-foreground">
                Works directly within Gmail, Instagram, LinkedIn, and Shopify.
                No switching between apps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple Pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free, upgrade when you grow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-2">Free</h3>
              <p className="text-3xl font-bold mb-1">₹0</p>
              <p className="text-sm text-muted-foreground mb-6">
                Perfect for trying out
              </p>
              <ul className="text-sm space-y-3 mb-6">
                <li className="flex items-center gap-2">✓ 1 AI Employee</li>
                <li className="flex items-center gap-2">✓ 50 tasks/day</li>
                <li className="flex items-center gap-2">✓ 2 platform connections</li>
                <li className="flex items-center gap-2">✓ Activity logs</li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Get Started
              </Link>
            </div>
            <div className="rounded-xl border-2 border-primary bg-card p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Popular
              </div>
              <h3 className="font-semibold text-lg mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-1">Contact Us</p>
              <p className="text-sm text-muted-foreground mb-6">
                For growing businesses
              </p>
              <ul className="text-sm space-y-3 mb-6">
                <li className="flex items-center gap-2">✓ 5 AI Employees</li>
                <li className="flex items-center gap-2">✓ 500 tasks/day</li>
                <li className="flex items-center gap-2">✓ All platforms</li>
                <li className="flex items-center gap-2">✓ Priority support</li>
                <li className="flex items-center gap-2">✓ Custom prompts</li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-lg mb-2">Enterprise</h3>
              <p className="text-3xl font-bold mb-1">Custom</p>
              <p className="text-sm text-muted-foreground mb-6">
                For large teams
              </p>
              <ul className="text-sm space-y-3 mb-6">
                <li className="flex items-center gap-2">✓ 20+ AI Employees</li>
                <li className="flex items-center gap-2">✓ Unlimited tasks</li>
                <li className="flex items-center gap-2">✓ Custom integrations</li>
                <li className="flex items-center gap-2">✓ Dedicated support</li>
                <li className="flex items-center gap-2">✓ SLA guarantee</li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Contact Sales
              </Link>
            </div>
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
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 EmployAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
