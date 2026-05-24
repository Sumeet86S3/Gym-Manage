import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { createQueryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FitSphere — Modern Fitness Studio Management" },
      {
        name: "description",
        content: "Role-based fitness studio management for admins, trainers, and clients.",
      },
      { property: "og:title", content: "FitSphere — Modern Fitness Studio Management" },
      {
        property: "og:description",
        content: "Role-based fitness studio management for admins, trainers, and clients.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "FitSphere — Modern Fitness Studio Management" },
      {
        name: "twitter:description",
        content: "Role-based fitness studio management for admins, trainers, and clients.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/75f14fe6-454e-4f11-b9a3-1740304b3122/id-preview-5a28071f--8f306edc-731c-4efe-8a4a-78853040fdf0.lovable.app-1777203153030.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/75f14fe6-454e-4f11-b9a3-1740304b3122/id-preview-5a28071f--8f306edc-731c-4efe-8a4a-78853040fdf0.lovable.app-1777203153030.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
