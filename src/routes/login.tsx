import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ShieldCheck, UserCheck, Dumbbell, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import authBg from "@/assets/auth-bg.jpg";
import { PasswordInput } from "@/components/password-input";
import { FullScreenLoader } from "@/components/full-screen-loader";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const roles: { id: UserRole; label: string; icon: typeof ShieldCheck; placeholder: string }[] = [
  { id: "admin", label: "Admin", icon: ShieldCheck, placeholder: "admin@example.com" },
  { id: "trainer", label: "Trainer", icon: UserCheck, placeholder: "trainer@example.com" },
  { id: "client", label: "Member", icon: Dumbbell, placeholder: "member@example.com" },
];

function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const target =
        user.role === "admin" ? "/admin" : user.role === "trainer" ? "/trainer" : "/client";
      navigate({ to: target });
    }
  }, [user, loading, navigate]);

  if (loading) return <FullScreenLoader />;
  if (!user && typeof navigator !== "undefined" && !navigator.onLine) {
    return (
      <AuthPageFrame>
        <div className="w-full max-w-sm rounded-3xl glass-strong p-8 text-center shadow-elevated">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <p className="font-semibold">You are offline</p>
          <p className="mt-1 text-sm text-muted-foreground">Reconnect to restore or start a secure session.</p>
        </div>
      </AuthPageFrame>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password, role, rememberMe);
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
                  disabled={submitting}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
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

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-busy={submitting}>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roles.find((r) => r.id === role)!.placeholder}
                  required
                  disabled={submitting}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </Field>
              <Field
                label="Password"
                right={
                  <button
                    type="button"
                    disabled={submitting}
                    className="text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Forgot?
                  </button>
                }
              >
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                  className="mt-1.5"
                  inputClassName="w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Remember me on this device
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="btn-glow group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  <>
                    {`Sign in as ${roles.find((r) => r.id === role)!.label}`}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
              {submitting && (
                <p className="text-center text-xs text-muted-foreground" role="status">
                  Verifying credentials and preparing your dashboard...
                </p>
              )}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 -z-10">
        <img src={authBg} alt="" className="h-full w-full object-cover opacity-60 dark:opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/85 to-background" />
        <div className="absolute inset-0 bg-grid opacity-50" />
      </div>
      {children}
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
