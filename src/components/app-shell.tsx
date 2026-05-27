import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Ruler,
  Target,
  MessageSquareHeart,
  BarChart3,
  Settings,
  ShieldCheck,
  UserCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Activity,
  TrendingUp,
  Wallet,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FullScreenLoader } from "@/components/full-screen-loader";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Trainer Approvals", to: "/admin/approvals", icon: UserCheck },
  { label: "Trainers", to: "/admin/trainers", icon: ShieldCheck },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const trainerNav: NavItem[] = [
  { label: "Dashboard", to: "/trainer", icon: LayoutDashboard },
  { label: "Clients", to: "/trainer/clients", icon: Users },
  { label: "Attendance", to: "/trainer/attendance", icon: CalendarCheck },
  { label: "Payments", to: "/trainer/payments", icon: CreditCard },
  { label: "Workout Plans", to: "/trainer/workouts", icon: Dumbbell },
  { label: "Measurements", to: "/trainer/measurements", icon: Ruler },
  { label: "Goals", to: "/trainer/goals", icon: Target },
  { label: "Feedback", to: "/trainer/feedback", icon: MessageSquareHeart },
  { label: "Meal Updates", to: "/trainer/meals", icon: UtensilsCrossed },
  { label: "Reports", to: "/trainer/reports", icon: BarChart3 },
  { label: "Settings", to: "/trainer/settings", icon: Settings },
];

const clientNav: NavItem[] = [
  { label: "My Workouts", to: "/client", icon: Dumbbell },
  { label: "My Progress", to: "/client/progress", icon: TrendingUp },
  { label: "Meal Tracker", to: "/client/meals", icon: UtensilsCrossed },
  { label: "Payments", to: "/client/payments", icon: Wallet },
  { label: "Goals", to: "/client/goals", icon: Target },
  { label: "Settings", to: "/client/settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, status, logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && status === "unauthenticated" && !user) navigate({ to: "/login" });
    if (!loading && user) {
      const roleRoot = `/${user.role}`;
      if (!location.pathname.startsWith(roleRoot)) navigate({ to: roleRoot });
    }
  }, [user, loading, status, navigate, location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (loading) return <FullScreenLoader />;
  if (status === "offline" && !user) {
    return (
      <AuthStatusScreen
        title="You are offline"
        description="Reconnect to restore your secure FitSphere session."
      />
    );
  }
  if (!user) return null;
  if (!location.pathname.startsWith(`/${user.role}`)) return null;

  const nav = user.role === "admin" ? adminNav : user.role === "trainer" ? trainerNav : clientNav;

  const roleLabel =
    user.role === "admin" ? "Admin" : user.role === "trainer" ? "Trainer" : "Member";

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <SidebarInner nav={nav} role={roleLabel} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-elevated">
            <div className="flex items-center justify-between p-4">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarInner nav={nav} role={roleLabel} hideBrand />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border glass-strong px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-foreground hover:bg-muted md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">{roleLabel} workspace</p>
              <p className="text-sm font-medium text-foreground">
                Welcome back, {user.name.split(" ")[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm shadow-soft hover:bg-muted">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight text-foreground">
                      {user.name}
                    </span>
                    <span className="block text-xs leading-tight text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogoutAll}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Sign out all devices
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function AuthStatusScreen({
  title,
  description = "Checking your secure session...",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rounded-2xl border border-border bg-card px-6 py-5 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity className="h-5 w-5" />
        </div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-110">
        <Activity className="h-5 w-5 text-primary-foreground" />
      </span>
      <span className="font-display text-base font-semibold tracking-tight text-sidebar-foreground">
        FitSphere
      </span>
    </Link>
  );
}

function SidebarInner({
  nav,
  role,
  hideBrand,
}: {
  nav: NavItem[];
  role: string;
  hideBrand?: boolean;
}) {
  return (
    <>
      {!hideBrand && (
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
      )}
      <div className="px-4 pb-3">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
          {role} Panel
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{
              exact:
                item.to.endsWith("/admin") || item.to.endsWith("/trainer") || item.to === "/client",
            }}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:shadow-soft"
          >
            <item.icon className="h-4 w-4 opacity-90" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-sidebar-accent/60 p-3 text-xs text-sidebar-accent-foreground">
          <p className="font-semibold">Need help?</p>
          <p className="mt-0.5 opacity-80">Check our docs or chat with support.</p>
        </div>
      </div>
    </>
  );
}

function NotificationsMenu() {
  const [items, setItems] = useState<
    Array<{ id: string; title: string; body?: string; desc?: string; time?: string }>
  >([]);

  useEffect(() => {
    api<Array<{ id: string; title: string; body?: string; desc?: string; time?: string }>>(
      "/notifications",
    )
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((n) => (
          <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium">{n.title}</span>
              <span className="text-[10px] text-muted-foreground">{n.time ?? "Now"}</span>
            </div>
            <span className="text-xs text-muted-foreground">{n.desc ?? n.body}</span>
          </DropdownMenuItem>
        ))}
        {items.length === 0 && (
          <DropdownMenuItem className="py-3 text-xs text-muted-foreground">
            No notifications yet.
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: typeof LayoutDashboard;
  tone?: "primary" | "accent" | "success" | "warning" | "info";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    info: "bg-info/15 text-info",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {delta && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="text-success">{delta}</span> vs last week
            </p>
          )}
        </div>
        <span
          className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneMap[tone])}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
