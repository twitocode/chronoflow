import { createFileRoute, Link } from '@tanstack/react-router'
import { TrendingUp, Sparkles, Bell, Shield, Zap, Users, ArrowRight, Star } from 'lucide-react'

export const Route = createFileRoute('/landing')({ component: LandingPage })

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Get intelligent stock predictions powered by advanced AI analysis of market trends and news sentiment."
  },
  {
    icon: Bell,
    title: "Real-Time News",
    description: "Stay ahead with live stock news aggregation from trusted sources, analyzed for market impact."
  },
  {
    icon: TrendingUp,
    title: "Smart Tracking",
    description: "Monitor your favorite stocks with beautiful charts and real-time price updates."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security and encryption."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Experience blazing-fast performance with optimized data fetching and caching."
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join thousands of investors making smarter decisions with ChronoFlow."
  }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Day Trader",
    content: "ChronoFlow's AI predictions have been incredibly accurate. It's like having a personal analyst.",
    avatar: "SC"
  },
  {
    name: "Michael Rodriguez",
    role: "Portfolio Manager",
    content: "The real-time news aggregation saves me hours every day. Essential tool for serious investors.",
    avatar: "MR"
  },
  {
    name: "Emily Watson",
    role: "Retail Investor",
    content: "Finally, a platform that makes stock analysis accessible without overwhelming complexity.",
    avatar: "EW"
  }
]

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500K+", label: "Predictions Made" },
  { value: "99.9%", label: "Uptime" },
  { value: "50M+", label: "Data Points Analyzed" }
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-6 text-primary" />
              <span className="text-xl font-bold text-foreground">ChronoFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/register"
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="mx-auto max-w-7xl px-6 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-4 py-1.5 mb-8">
              <Star className="size-4 text-accent fill-accent" />
              <span className="text-sm font-medium text-foreground">AI-Powered Stock Analysis Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-6">
              Make Smarter
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Investment Decisions
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Harness the power of AI to analyze market trends, news sentiment, and stock patterns. 
              Get actionable insights in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Start Trading Free
                <ArrowRight className="size-5" />
              </Link>
              <Link 
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all"
              >
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-border/50">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for both beginner and experienced investors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="bg-card rounded-3xl p-8 border border-border hover:border-primary/30 transition-all hover:shadow-lg group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="size-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Trusted by Investors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our community has to say about ChronoFlow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.name}
                className="bg-card rounded-3xl p-8 border border-border hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="size-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-12 text-center text-primary-foreground shadow-2xl">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-xl mx-auto">
              Join thousands of investors using ChronoFlow to make smarter trading decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                Create Free Account
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              <span className="font-semibold text-foreground">ChronoFlow</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 ChronoFlow. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
