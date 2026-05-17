import type { Client } from "@/lib/types";

export type MeasurementKey =
  | "chest"
  | "arms"
  | "upperBelly"
  | "lowerBelly"
  | "hip"
  | "waist"
  | "thigh"
  | "calf"
  | "weight";

export type MeasurementUnit = "cm" | "kg";

export interface MeasurementFieldConfig {
  key: MeasurementKey;
  label: string;
  unit: MeasurementUnit;
  placeholder: string;
}

export interface BodyMeasurementEntry {
  id: string;
  clientId: string;
  measuredAt: string;
  chest?: number;
  arms?: number;
  upperBelly?: number;
  lowerBelly?: number;
  hip?: number;
  waist?: number;
  thigh?: number;
  calf?: number;
  weight?: number;
}

export interface ClientMeasurementOption extends Client {
  avatarUrl?: string;
}

export const measurementFields: MeasurementFieldConfig[] = [
  { key: "chest", label: "Chest", unit: "cm", placeholder: "102" },
  { key: "arms", label: "Arms", unit: "cm", placeholder: "37" },
  { key: "upperBelly", label: "Upper Belly", unit: "cm", placeholder: "86" },
  { key: "lowerBelly", label: "Lower Belly", unit: "cm", placeholder: "92" },
  { key: "hip", label: "Hip", unit: "cm", placeholder: "101" },
  { key: "waist", label: "Waist", unit: "cm", placeholder: "82" },
  { key: "thigh", label: "Thigh", unit: "cm", placeholder: "58" },
  { key: "calf", label: "Calf", unit: "cm", placeholder: "38" },
  { key: "weight", label: "Weight", unit: "kg", placeholder: "78" },
];
