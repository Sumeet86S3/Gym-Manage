import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app-shell";
import { toast } from "sonner";

export function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and account preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Profile updated.");
          }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-base font-semibold">Profile</h3>
          <p className="text-sm text-muted-foreground">Update your personal details.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90">
              Save changes
            </button>
          </div>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Password updated.");
          }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-base font-semibold">Password</h3>
          <p className="text-sm text-muted-foreground">Change your password regularly to keep your account safe.</p>
          <div className="mt-5 space-y-4">
            {["Current password", "New password", "Confirm new password"].map((l) => (
              <div key={l}>
                <label className="text-sm font-medium">{l}</label>
                <input
                  type="password"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90">
              Update password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
