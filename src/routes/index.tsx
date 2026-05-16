import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useReveal } from "@/hooks/use-reveal";
import { ThemeToggle } from "@/lib/theme";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Dumbbell,
  Flame,
  HeartPulse,
  Trophy,
  Users,
  Star,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import heroImg from "@/assets/hero-gym.jpg";
import strengthImg from "@/assets/program-strength.jpg";
import cardioImg from "@/assets/program-cardio.jpg";
import mobilityImg from "@/assets/program-mobility.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useReveal();

  useEffect(() => {
    if (user) {
      const target =
        user.role === "admin" ? "/admin" : user.role === "trainer" ? "/trainer" : "/client";
      navigate({ to: target });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar />
      <Hero />
      <Stats />
      <Programs />
      <Transformations />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------- Navbar ---------- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 " + (scrolled ? "py-2" : "py-4")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <div
          className={
            "flex w-full items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 " +
            (scrolled ? "glass-strong shadow-elevated" : "border border-transparent")
          }
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-110">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">FitSphere</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#programs" className="story-link hover:text-foreground transition">
              Programs
            </a>
            <a href="#transform" className="story-link hover:text-foreground transition">
              Results
            </a>
            <a href="#testimonials" className="story-link hover:text-foreground transition">
              Stories
            </a>
            <a href="#cta" className="story-link hover:text-foreground transition">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"
            >
              Join now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-32 md:pt-40">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt=""
          className="h-full w-full object-cover opacity-50 dark:opacity-60"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-60" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> The next-gen fitness studio OS
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Train harder. <br />
            <span className="text-gradient">Manage smarter.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            FitSphere unifies admins, trainers and members into one beautifully designed workspace —
            workouts, payments, progress and live feedback in real time.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="btn-glow group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Start training free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#programs"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card"
            >
              <PlayCircle className="h-4 w-4" /> Watch 60-sec demo
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Setup in minutes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Cancel anytime
            </span>
          </div>
        </div>

        {/* Floating glass cards */}
        <div className="relative mx-auto mt-16 hidden max-w-4xl md:block">
          <div className="float-slow absolute -left-6 top-8 w-56 rounded-2xl glass p-4 shadow-elevated">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <HeartPulse className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Today's energy</p>
                <p className="text-sm font-semibold">94 BPM avg</p>
              </div>
            </div>
          </div>
          <div className="float-fast absolute -right-4 top-24 w-60 rounded-2xl glass p-4 shadow-elevated">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Trophy className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="text-sm font-semibold">14 days strong 🔥</p>
              </div>
            </div>
          </div>
          <div className="float-slow absolute left-1/2 top-44 w-64 -translate-x-1/2 rounded-2xl glass p-4 shadow-elevated">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Weekly volume</p>
              <span className="text-xs font-semibold text-primary">+18%</span>
            </div>
            <div className="mt-2 flex items-end gap-1">
              {[40, 60, 35, 75, 55, 90, 70].map((h, i) => (
                <span
                  key={i}
                  className="w-4 rounded-sm bg-gradient-to-t from-primary to-primary-glow"
                  style={{ height: `${h}%`, minHeight: 12 }}
                />
              ))}
            </div>
          </div>
          <div className="h-72" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats ---------- */
function Stats() {
  const stats = [
    { label: "Active members", value: "12,400+", icon: Users },
    { label: "Workouts logged", value: "1.8M", icon: Dumbbell },
    { label: "Studios powered", value: "320", icon: ShieldCheck },
    { label: "Avg. retention", value: "92%", icon: Trophy },
  ];
  return (
    <section className="relative border-y border-border bg-card/40 py-16 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="reveal flex flex-col items-start gap-2"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <p className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {s.value}
            </p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Programs ---------- */
function Programs() {
  const items = [
    {
      title: "Strength & Power",
      desc: "Progressive overload programs built by elite coaches.",
      img: strengthImg,
      tag: "Build muscle",
      icon: Dumbbell,
    },
    {
      title: "Cardio & Endurance",
      desc: "Heart-rate-driven HIIT, intervals and steady-state plans.",
      img: cardioImg,
      tag: "Burn fat",
      icon: Flame,
    },
    {
      title: "Mobility & Recovery",
      desc: "Yoga, stretching and recovery sessions for longevity.",
      img: mobilityImg,
      tag: "Move better",
      icon: HeartPulse,
    },
  ];
  return (
    <section id="programs" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Programs
          </span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Built for every kind of athlete
          </h2>
          <p className="mt-4 text-muted-foreground">
            Trainers can deploy curated programs in seconds. Members get a plan that adapts to their
            energy, schedule and goals.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((p, i) => (
            <article
              key={p.title}
              className="reveal lift group relative overflow-hidden rounded-3xl border border-border bg-card shadow-card"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                  <p.icon className="h-3 w-3 text-primary" /> {p.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <a
                  href="#cta"
                  className="story-link mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  Explore plan <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Transformations ---------- */
function Transformations() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Admins",
      desc: "Approve trainers, monitor revenue and oversee the whole studio from one dashboard.",
    },
    {
      icon: UserCheck,
      title: "Trainers",
      desc: "Manage clients, attendance, payments and live feedback without spreadsheets.",
    },
    {
      icon: Dumbbell,
      title: "Members",
      desc: "See today's workout, log sessions and share daily feedback in seconds.",
    },
  ];
  return (
    <section id="transform" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-70" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="reveal">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              One platform · Three roles
            </span>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Real workflows, <span className="text-gradient">real results.</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              FitSphere replaces the patchwork of WhatsApp groups, paper logs and clunky tools with
              a single, role-aware workspace your whole studio will love.
            </p>
            <div className="mt-8 space-y-4">
              {items.map((f, i) => (
                <div
                  key={f.title}
                  className="reveal flex gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur lift"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal relative">
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-elevated">
              <img
                src={strengthImg}
                alt="Trainer"
                className="h-[520px] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl glass-dark p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-80">Member transformation</p>
                    <p className="font-display text-2xl font-semibold">−18 kg in 6 months</p>
                  </div>
                  <span className="rounded-full bg-primary/30 px-3 py-1 text-xs font-medium">
                    Verified
                  </span>
                </div>
              </div>
            </div>
            <div className="float-slow absolute -right-4 -top-4 hidden rounded-2xl glass p-4 shadow-elevated md:block">
              <p className="text-xs text-muted-foreground">Calories today</p>
              <p className="font-display text-2xl font-semibold">2,140</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  const items = [
    {
      name: "Sam Patel",
      role: "Lead Trainer · Iron & Oak",
      quote: "Our studio runs 3× smoother since switching. Onboarding new clients takes minutes.",
    },
    {
      name: "Priya Shah",
      role: "Member · Pune",
      quote: "Love seeing my plan, payments and feedback in one place. The app feels premium.",
    },
    {
      name: "Rohit Verma",
      role: "Studio Owner · Mumbai",
      quote: "Revenue dashboards finally make sense. Trainer approvals are a single tap.",
    },
  ];
  return (
    <section id="testimonials" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Loved by studios
          </span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Trusted by trainers worldwide
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <figure
              key={t.name}
              className="reveal lift rounded-3xl border border-border bg-card p-6 shadow-card"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-base leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt=""
          className="h-full w-full object-cover opacity-30"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/90 to-background" />
      </div>
      <div className="mx-auto max-w-4xl px-6">
        <div className="reveal relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card to-card/40 p-10 text-center shadow-elevated md:p-16">
          <div className="absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Your studio. <span className="text-gradient">Levelled up.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Join hundreds of studios using FitSphere to deliver a premium experience to every
            member. Start free — no card needed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="btn-glow inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Apply as a trainer <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold hover:bg-muted"
            >
              Open the app
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-border bg-card/40 py-12 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="font-display text-lg font-semibold">FitSphere</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The all-in-one operating system for modern fitness studios. Built for trainers, loved
              by members.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:scale-110 hover:text-primary"
                  aria-label="social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Product" links={["Programs", "Pricing", "Trainers", "Members"]} />
          <FooterCol title="Company" links={["About", "Careers", "Press", "Contact"]} />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 FitSphere. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="story-link transition hover:text-foreground">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
