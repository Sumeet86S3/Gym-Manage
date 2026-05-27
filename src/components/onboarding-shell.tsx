import type { ReactNode } from "react";
import type { OnboardingStep } from "@/lib/onboarding";

export function OnboardingShell({
  step,
  children,
}: {
  step: OnboardingStep | null;
  children: ReactNode;
}) {
  return (
    <section data-onboarding-flow={step?.flow ?? "none"} data-onboarding-step={step?.id ?? "none"}>
      {children}
    </section>
  );
}
