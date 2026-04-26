"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type LatencyDataPoint = {
  time: string;
  latencyMs: number | null;
  ok: boolean;
};

const chartConfig = {
  latencyMs: {
    label: "Latency",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function LatencyChart({
  data,
  latencyThresholdMs,
}: {
  data: LatencyDataPoint[];
  latencyThresholdMs?: number | null;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
        No check data yet
      </div>
    );
  }

  // recharts needs oldest-first
  const ordered = [...data].reverse();

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <AreaChart
        data={ordered}
        margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-latencyMs)"
              stopOpacity={0.25}
            />
            <stop
              offset="95%"
              stopColor="var(--color-latencyMs)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="stroke-border/40"
        />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}ms`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="bg-card/80 backdrop-blur-md border-border/40 shadow-xl"
              labelFormatter={(label) => label}
              formatter={(value, _name, item) => {
                const row = item.payload as LatencyDataPoint;
                return (
                  <span className={row.ok ? "" : "text-destructive"}>
                    {value}ms{!row.ok && " · failed"}
                  </span>
                );
              }}
            />
          }
        />
        {latencyThresholdMs != null && (
          <ReferenceLine
            y={latencyThresholdMs}
            stroke="var(--destructive)"
            strokeDasharray="4 3"
            strokeOpacity={0.55}
            label={{
              value: `${latencyThresholdMs}ms limit`,
              position: "insideTopRight",
              fontSize: 9,
              fill: "var(--destructive)",
              opacity: 0.65,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="latencyMs"
          stroke="var(--color-latencyMs)"
          strokeWidth={1.5}
          fill="url(#latencyGradient)"
          dot={(props) => {
            const { cx, cy, payload } = props as {
              cx: number;
              cy: number;
              payload: LatencyDataPoint;
            };
            if (payload.latencyMs === null) return <g key={props.key} />;
            return (
              <circle
                key={props.key}
                cx={cx}
                cy={cy}
                r={3}
                fill={
                  payload.ok ? "var(--color-latencyMs)" : "var(--destructive)"
                }
                stroke="none"
              />
            );
          }}
          activeDot={{ r: 4 }}
          connectNulls={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
