import { useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app-shell";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PasswordInput } from "@/components/password-input";

export function SettingsPage() {
  const { user, updateMe } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const updatePasswordField =
    (field: keyof typeof passwordForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await api("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateMe({ name, email });
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and account preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={saveProfile}
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
            <button
              disabled={savingProfile}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>

        <form
          onSubmit={changePassword}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-base font-semibold">Password</h3>
          <p className="text-sm text-muted-foreground">
            Change your password regularly to keep your account safe.
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Current password</label>
              <PasswordInput
                required
                value={passwordForm.currentPassword}
                onChange={updatePasswordField("currentPassword")}
                autoComplete="current-password"
                className="mt-1.5"
                inputClassName="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">New password</label>
              <PasswordInput
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={updatePasswordField("newPassword")}
                autoComplete="new-password"
                className="mt-1.5"
                inputClassName="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm new password</label>
              <PasswordInput
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={updatePasswordField("confirmPassword")}
                autoComplete="new-password"
                className="mt-1.5"
                inputClassName="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              disabled={savingPassword}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
