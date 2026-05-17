import { createFileRoute } from "@tanstack/react-router";
import { Activity, Dumbbell, Ruler, Scale, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ClientMeasurementSelector } from "@/components/measurements/ClientMeasurementSelector";
import { MeasurementCard } from "@/components/measurements/MeasurementCard";
import { MeasurementForm } from "@/components/measurements/MeasurementForm";
import { MeasurementHistoryTable } from "@/components/measurements/MeasurementHistoryTable";
import { MeasurementStatWidget } from "@/components/measurements/MeasurementStatWidget";
import { ProgressChart } from "@/components/measurements/ProgressChart";
import {
  demoClients,
  demoMeasurementHistory,
  enrichApiMeasurements,
} from "@/components/measurements/measurement-demo-data";
import {
  measurementFields,
  type BodyMeasurementEntry,
  type ClientMeasurementOption,
  type MeasurementKey,
} from "@/components/measurements/types";
import { useApiResource } from "@/hooks/use-api-resource";
import { api } from "@/lib/api";
import type { Client, MeasurementRecord } from "@/lib/live-data";
import { toast } from "sonner";

export const Route = createFileRoute("/trainer/measurements")({
  component: MeasurementsPage,
});

function MeasurementsPage() {
  const { data: apiClients, loading: clientsLoading } = useApiResource<Client[]>("/clients", []);
  const clients = useMemo<ClientMeasurementOption[]>(
    () => demoClients(apiClients as ClientMeasurementOption[]),
    [apiClients],
  );
  const [selectedClientId, setSelectedClientId] = useState("");
  const [localEntries, setLocalEntries] = useState<BodyMeasurementEntry[]>([]);

  useEffect(() => {
    if (!selectedClientId && clients[0]?.id) setSelectedClientId(clients[0].id);
  }, [clients, selectedClientId]);

  const {
    data: apiRows,
    loading: measurementsLoading,
    reload,
  } = useApiResource<MeasurementRecord[]>(
    selectedClientId ? `/measurements?clientId=${selectedClientId}` : "/measurements?clientId=none",
    [],
  );

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const demoHistory = useMemo(() => demoMeasurementHistory(clients), [clients]);
  const history = useMemo(
    () =>
      [
        ...demoHistory.filter((entry) => entry.clientId === selectedClientId),
        ...enrichApiMeasurements(apiRows, selectedClientId),
        ...localEntries.filter((entry) => entry.clientId === selectedClientId),
      ].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()),
    [apiRows, demoHistory, localEntries, selectedClientId],
  );

  const latest = history.at(-1);
  const baseline = history[0];
  const loading = clientsLoading || measurementsLoading;

  async function saveMeasurement(entry: BodyMeasurementEntry) {
    setLocalEntries((current) => [...current, entry]);
    toast.success("Measurements saved", {
      description: "Charts and history were updated for this client.",
    });

    try {
      await api("/measurements", {
        method: "POST",
        body: JSON.stringify({
          clientId: entry.clientId,
          weight: entry.weight,
          chest: entry.chest,
          waist: entry.waist,
          arms: entry.arms,
          measuredAt: entry.measuredAt,
        }),
      });
      reload();
    } catch {
      toast.warning("Saved in this session", {
        description: "The extended demo fields are visible here even if the API is unavailable.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Measurements"
        description="Client-wise body measurement tracking for transformation coaching."
      />

      <ClientMeasurementSelector
        clients={clients}
        selectedClientId={selectedClientId}
        onSelect={setSelectedClientId}
        loading={clientsLoading}
      />

      {loading ? (
        <MeasurementsSkeleton />
      ) : selectedClient ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MeasurementStatWidget
              title="Latest Weight"
              value={formatMetric(latest?.weight, "kg")}
              helper="Current body weight"
              trend={percentChange(baseline?.weight, latest?.weight)}
              icon={Scale}
              tone="primary"
            />
            <MeasurementStatWidget
              title="Latest Waist"
              value={formatMetric(latest?.waist, "cm")}
              helper="Core circumference"
              trend={percentChange(baseline?.waist, latest?.waist)}
              icon={Ruler}
              tone="success"
            />
            <MeasurementStatWidget
              title="Latest Chest"
              value={formatMetric(latest?.chest, "cm")}
              helper="Upper body marker"
              trend={percentChange(baseline?.chest, latest?.chest)}
              icon={Dumbbell}
              tone="info"
            />
            <MeasurementStatWidget
              title="Latest Update"
              value={latest ? formatDate(latest.measuredAt, true) : "--"}
              helper={`${history.length} total check-ins`}
              icon={Activity}
              tone="warning"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {measurementFields.map((field) => (
              <MeasurementCard
                key={field.key}
                label={field.label}
                value={latest?.[field.key]}
                unit={field.unit}
                change={difference(baseline?.[field.key], latest?.[field.key])}
                icon={metricIcon(field.key)}
                compact
              />
            ))}
          </section>

          <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.4fr]">
            <MeasurementForm
              clientId={selectedClientId}
              disabled={!selectedClientId}
              onSave={saveMeasurement}
            />
            <ProgressChart history={history} />
          </div>

          <MeasurementHistoryTable history={history} />
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-foreground">No client selected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add or select a client to start tracking measurements.
          </p>
        </div>
      )}
    </div>
  );
}

function MeasurementsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.4fr]">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

function formatMetric(value: number | undefined, unit: string) {
  if (typeof value !== "number") return "--";
  return `${value.toFixed(value % 1 ? 1 : 0)} ${unit}`;
}

function formatDate(value: string, short = false) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
  });
}

function difference(start?: number, latest?: number) {
  if (typeof start !== "number" || typeof latest !== "number") return undefined;
  return latest - start;
}

function percentChange(start?: number, latest?: number) {
  if (!start || typeof latest !== "number") return undefined;
  return ((latest - start) / start) * 100;
}

function metricIcon(key: MeasurementKey) {
  if (key === "weight") return Scale;
  if (key === "arms" || key === "thigh" || key === "calf") return Dumbbell;
  if (key.includes("Belly") || key === "waist") return Target;
  return Ruler;
}
