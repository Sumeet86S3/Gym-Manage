import { useMemo, useState } from "react";
import type { UserRole } from "./types";

export type OnboardingFlow = "gym-setup" | "trainer-onboarding" | "initial-setup";

export interface OnboardingStep {
  id: string;
  title: string;
  flow: OnboardingFlow;
  roles: UserRole[];
  required?: boolean;
}

const steps: OnboardingStep[] = [
  {
    id: "gym-profile",
    title: "Gym profile",
    flow: "gym-setup",
    roles: ["admin"],
    required: true,
  },
  {
    id: "trainer-profile",
    title: "Trainer profile",
    flow: "trainer-onboarding",
    roles: ["trainer"],
    required: true,
  },
  {
    id: "first-workspace",
    title: "First workspace",
    flow: "initial-setup",
    roles: ["admin", "trainer"],
  },
];

export function useOnboardingPlan(role?: UserRole | null) {
  const availableSteps = useMemo(
    () => (role ? steps.filter((step) => step.roles.includes(role)) : []),
    [role],
  );
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  return {
    steps: availableSteps,
    completed,
    nextStep: availableSteps.find((step) => !completed.has(step.id)) ?? null,
    markComplete(stepId: string) {
      setCompleted((current) => new Set(current).add(stepId));
    },
    reset() {
      setCompleted(new Set());
    },
  };
}
