import type { Client } from "@/lib/types";

export type MeasurementKey =
  | "chest"
  | "leftBicep"
  | "rightBicep"
  | "leftForearm"
  | "rightForearm"
  | "upperBelly"
  | "lowerBelly"
  | "hip"
  | "waist"
  | "leftThigh"
  | "rightThigh"
  | "leftCalf"
  | "rightCalf"
  | "weight"
  | "height";

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
  leftBicep?: number;
  rightBicep?: number;
  leftForearm?: number;
  rightForearm?: number;
  upperBelly?: number;
  lowerBelly?: number;
  hip?: number;
  waist?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
  weight?: number;
  height?: number;
}

export interface ClientMeasurementOption extends Client {
  avatarUrl?: string;
}

export const measurementFields: MeasurementFieldConfig[] = [
  { key: "chest", label: "Chest", unit: "cm", placeholder: "102" },
  { key: "leftBicep", label: "Left bicep", unit: "cm", placeholder: "36" },
  { key: "rightBicep", label: "Right bicep", unit: "cm", placeholder: "36" },
  { key: "leftForearm", label: "Left forearm", unit: "cm", placeholder: "28" },
  { key: "rightForearm", label: "Right forearm", unit: "cm", placeholder: "28" },
  { key: "upperBelly", label: "Upper Belly", unit: "cm", placeholder: "86" },
  { key: "lowerBelly", label: "Lower Belly", unit: "cm", placeholder: "92" },
  { key: "waist", label: "Waist", unit: "cm", placeholder: "82" },
  { key: "hip", label: "Hips", unit: "cm", placeholder: "101" },
  { key: "leftThigh", label: "Left Thigh", unit: "cm", placeholder: "58" },
  { key: "rightThigh", label: "Right Thigh", unit: "cm", placeholder: "58" },
  { key: "leftCalf", label: "Left Calf", unit: "cm", placeholder: "38" },
  { key: "rightCalf", label: "Right Calf", unit: "cm", placeholder: "38" },
  { key: "weight", label: "Weight", unit: "kg", placeholder: "78" },
  { key: "height", label: "Height", unit: "cm", placeholder: "172" },
];
