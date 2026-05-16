import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";
import authBg from "@/assets/auth-bg.jpg";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { user, signupTrainer, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const Background = () => (
    <div className="absolute inset-0 -z-10">
      <img src={authBg} alt="" className="h-full w-full object-cover opacity-60 dark:opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/85 to-background" />
      <div className="absolute inset-0 bg-grid opacity-50" />
    </div>
  );

  if (user && user.role === "trainer" && !user.approved) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <Background />
        <div className="w-full max-w-md rounded-3xl glass-strong p-8 text-center shadow-elevated animate-fade-up">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/25 text-warning-foreground pulse-glow">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">Waiting for admin approval</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks for signing up, <span className="font-medium text-foreground">{user.name}</span>.
            Your trainer account is currently <span className="font-medium">Pending Approval</span>.
            You'll get access once an admin approves your application.
          </p>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="mt-6 w-full rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupTrainer(name || "New Trainer", email, password);
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">FitSphere</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="rounded-3xl glass-strong p-8 shadow-elevated">
            <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
              Trainer application
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Apply as a trainer</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Trainers join by application. An admin will review your account.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {[
                { label: "Full name", value: name, set: setName, type: "text" },
                { label: "Email", value: email, set: setEmail, type: "email" },
                { label: "Password", value: password, set: setPassword, type: "password" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-sm font-medium">{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
              <button className="btn-glow group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                Submit application
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have access?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
