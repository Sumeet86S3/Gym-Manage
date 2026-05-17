import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ClientMeasurementOption } from "./types";

interface ClientMeasurementSelectorProps {
  clients: ClientMeasurementOption[];
  selectedClientId: string;
  onSelect: (clientId: string) => void;
  loading?: boolean;
}

export function ClientMeasurementSelector({
  clients,
  selectedClientId,
  onSelect,
  loading,
}: ClientMeasurementSelectorProps) {
  const [query, setQuery] = useState("");
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.goal].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [clients, query]);

  return (
    <section className="rounded-2xl border border-border bg-card/95 p-5 shadow-card backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Select Client
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            Body transformation workspace
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search a client, review their latest check-in, and log new measurements.
          </p>
        </div>
        {selectedClient ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 px-4 py-3">
            <ClientAvatar client={selectedClient} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {selectedClient.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{selectedClient.goal}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-xl border border-input bg-background/80 p-2">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or goal"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : filteredClients.length ? (
            filteredClients.map((client) => {
              const active = client.id === selectedClientId;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => onSelect(client.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-primary/10 ${
                    active ? "bg-primary/10 ring-1 ring-primary/25" : ""
                  }`}
                >
                  <ClientAvatar client={client} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {client.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {client.email}
                    </span>
                  </span>
                  <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
                    {client.goal}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No clients match this search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ClientAvatar({ client }: { client: ClientMeasurementOption }) {
  const initials = client.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (client.avatarUrl) {
    return (
      <img
        src={client.avatarUrl}
        alt=""
        className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20"
      />
    );
  }

  return (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow-card">
      {initials || <UserRound className="h-5 w-5" />}
    </span>
  );
}
