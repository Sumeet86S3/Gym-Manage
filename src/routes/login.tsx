import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ShieldCheck, UserCheck, Dumbbell, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import authBg from "@/assets/auth-bg.jpg";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const roles: { id: UserRole; label: string; icon: typeof ShieldCheck; demoEmail: string }[] = [
  { id: "admin", label: "Admin", icon: ShieldCheck, demoEmail: "admin@fitsphere.com" },
  { id: "trainer", label: "Trainer", icon: UserCheck, demoEmail: "trainer@fitsphere.com" },
  { id: "client", label: "Member", icon: Dumbbell, demoEmail: "client@fitsphere.com" },
];

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("trainer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(
        email || roles.find((r) => r.id === role)!.demoEmail,
        password,
        role,
      );
      if (user.role === "trainer" && !user.approved) {
        navigate({ to: "/signup" });
        return;
      }
      const target =
        user.role === "admin" ? "/admin" : user.role === "trainer" ? "/trainer" : "/client";
      navigate({ to: target });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={authBg}
          alt=""
          className="h-full w-full object-cover opacity-60 dark:opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/85 to-background" />
        <div className="absolute inset-0 bg-grid opacity-50" />
      </div>

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
            <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Welcome back
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
              Sign in to FitSphere
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Choose your role to continue.</p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-medium transition",
                    role === r.id
                      ? "border-primary/60 bg-primary/10 text-primary shadow-glow"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card",
                  )}
                >
                  <r.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roles.find((r) => r.id === role)!.demoEmail}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field
                label="Password"
                right={
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot?
                  </button>
                }
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <button
                type="submit"
                disabled={submitting}
                className="btn-glow group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                {submitting
                  ? "Signing in..."
                  : `Sign in as ${roles.find((r) => r.id === role)!.label}`}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
            {error && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New trainer?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Apply for an account
              </Link>
            </p>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Demo accounts use password: password123.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  right,
}: {
  label: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}
