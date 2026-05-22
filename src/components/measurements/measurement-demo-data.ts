import type { MeasurementRecord } from "@/lib/live-data";
import type { BodyMeasurementEntry, ClientMeasurementOption } from "./types";

const sampleProfiles = [
  {
    name: "Olivia Bennett",
    email: "olivia@example.com",
    goal: "Body recomposition",
    status: "Active" as const,
    joinedAt: "2024-12-10",
    streak: 18,
    plan: "Premium Quarterly",
    paymentStatus: "Paid" as const,
    dueDate: "2026-07-10",
  },
  {
    name: "Liam Carter",
    email: "liam@example.com",
    goal: "Lean muscle gain",
    status: "Active" as const,
    joinedAt: "2025-01-22",
    streak: 12,
    plan: "Elite Coaching",
    paymentStatus: "Paid" as const,
    dueDate: "2026-06-28",
  },
  {
    name: "Maya Shah",
    email: "maya@example.com",
    goal: "Fat loss",
    status: "Active" as const,
    joinedAt: "2025-02-03",
    streak: 9,
    plan: "Transformation",
    paymentStatus: "Due Soon" as const,
    dueDate: "2026-05-30",
  },
];

const baseMeasurements = [
  {
    weight: 84.6,
    chest: 101,
    arms: 34.2,
    upperBelly: 91,
    lowerBelly: 97,
    hip: 106,
    waist: 90,
    thigh: 62,
    calf: 39,
  },
  {
    weight: 76.2,
    chest: 98,
    arms: 35.8,
    upperBelly: 84,
    lowerBelly: 89,
    hip: 99,
    waist: 82,
    thigh: 58,
    calf: 38,
  },
  {
    weight: 69.8,
    chest: 93,
    arms: 31.4,
    upperBelly: 86,
    lowerBelly: 94,
    hip: 103,
    waist: 83,
    thigh: 57,
    calf: 36,
  },
];

export function demoClients(clients: ClientMeasurementOption[]) {
  if (clients.length) return clients;
  return sampleProfiles.map((profile, index) => ({ id: `demo-client-${index + 1}`, ...profile }));
}

export function demoMeasurementHistory(clients: ClientMeasurementOption[]): BodyMeasurementEntry[] {
  return demoClients(clients).flatMap((client, clientIndex) => {
    const base = baseMeasurements[clientIndex % baseMeasurements.length];
    const isGain = client.goal.toLowerCase().includes("gain");

    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (7 - index) * 14);
      const progress = index / 7;
      const weightShift = isGain ? progress * 4.2 : -progress * 7.4;
      const trim = isGain ? progress * 1.4 : progress * 8.2;

      return {
        id: `${client.id}-demo-${index}`,
        clientId: client.id,
        measuredAt: date.toISOString(),
        weight: round(base.weight + weightShift),
        chest: round(base.chest + (isGain ? progress * 4 : -progress * 1.2)),
        arms: round(base.arms + progress * (isGain ? 3.5 : 1.1)),
        upperBelly: round(base.upperBelly - trim * 0.85),
        lowerBelly: round(base.lowerBelly - trim),
        hip: round(base.hip - trim * 0.45),
        waist: round(base.waist - trim * 0.95),
        thigh: round(base.thigh + (isGain ? progress * 2.1 : -progress * 1.6)),
        calf: round(base.calf + (isGain ? progress * 1.2 : -progress * 0.4)),
      };
    });
  });
}

export function enrichApiMeasurements(
  rows: MeasurementRecord[],
  clientId: string,
): BodyMeasurementEntry[] {
  return rows.map((row, index) => ({
    id: row.id,
    clientId,
    measuredAt: row.measuredAt,
    weight: row.weight,
    chest: row.chest,
    arms: row.arms,
    upperBelly: row.upperBelly ?? (row.waist ? round(row.waist + 4 - index * 0.2) : undefined),
    lowerBelly: row.lowerBelly ?? (row.waist ? round(row.waist + 8 - index * 0.3) : undefined),
    hip: row.hip ?? (row.waist ? round(row.waist + 14 - index * 0.15) : undefined),
    waist: row.waist,
    thigh: row.thigh ?? (row.waist ? round(row.waist - 26 + index * 0.1) : undefined),
    calf: row.calf ?? (row.arms ? round(row.arms + 1.5) : undefined),
  }));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
