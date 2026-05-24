import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartRow = Record<string, string | number>;

interface ChartProps {
  data: ChartRow[];
  gradientId?: string;
}

const chartMargin = { top: 5, right: 10, left: -20, bottom: 0 };

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-popover)",
};

function ChartGrid() {
  return <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />;
}

function ChartXAxis({ dataKey }: { dataKey: string }) {
  return (
    <XAxis
      dataKey={dataKey}
      stroke="var(--color-muted-foreground)"
      fontSize={12}
      tickLine={false}
      axisLine={false}
    />
  );
}

function ChartYAxis() {
  return (
    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
  );
}

export function AttendanceAreaChart({ data, gradientId = "attendance-area" }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={chartMargin}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <ChartGrid />
        <ChartXAxis dataKey="day" />
        <ChartYAxis />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="visits"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AttendanceBarChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={chartMargin}>
        <ChartGrid />
        <ChartXAxis dataKey="day" />
        <ChartYAxis />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="visits" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={chartMargin}>
        <ChartGrid />
        <ChartXAxis dataKey="month" />
        <ChartYAxis />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="revenue" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueLineChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={chartMargin}>
        <ChartGrid />
        <ChartXAxis dataKey="month" />
        <ChartYAxis />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary)"
          strokeWidth={3}
          dot={{ r: 4, fill: "var(--color-primary)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
