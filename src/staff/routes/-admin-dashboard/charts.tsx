import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "@staff/components/shared/section-card";
import { formatZAR } from "@staff/lib/format";

export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
  warning: "hsl(var(--warning))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted-foreground))",
  card: "hsl(var(--card))",
};

export const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.quinary,
  CHART_COLORS.warning,
];

export function SalesPipelineChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <SectionCard title="Sales Pipeline" description="Leads by stage" className="xl:col-span-8">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} stroke={CHART_COLORS.border} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="status"
              width={110}
              tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
              stroke={CHART_COLORS.border}
            />
            <Tooltip
              contentStyle={{ background: CHART_COLORS.card, border: `1px solid ${CHART_COLORS.border}`, borderRadius: "12px", fontSize: "12px" }}
            />
            <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function LeadStatusBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <SectionCard title="Lead Status Breakdown" className="xl:col-span-4">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: CHART_COLORS.card, border: `1px solid ${CHART_COLORS.border}`, borderRadius: "12px", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function RevenueCommissionChart({
  data,
}: {
  data: { month: string; revenue: number; commission: number }[];
}) {
  return (
    <SectionCard title="Revenue & Commission" description="Last 7 months" className="xl:col-span-8">
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
            <XAxis dataKey="month" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} stroke={CHART_COLORS.border} />
            <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} stroke={CHART_COLORS.border} tickFormatter={(v) => formatZAR(v, { compact: true })} />
            <Tooltip
              formatter={(v: number) => formatZAR(v)}
              contentStyle={{ background: CHART_COLORS.card, border: `1px solid ${CHART_COLORS.border}`, borderRadius: "12px", fontSize: "12px" }}
            />
            <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.18} strokeWidth={2} />
            <Area type="monotone" dataKey="commission" stroke={CHART_COLORS.tertiary} fill={CHART_COLORS.tertiary} fillOpacity={0.18} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
