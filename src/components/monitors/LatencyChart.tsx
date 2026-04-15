"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
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

export function LatencyChart({ data }: { data: LatencyDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-xs text-muted-foreground">
        No check data yet
      </div>
    );
  }

  // recharts needs oldest-first
  const ordered = [...data].reverse();

  return (
    <ChartContainer config={chartConfig} className="h-[180px] w-full">
      <LineChart
        data={ordered}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
      >
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
        <Line
          type="monotone"
          dataKey="latencyMs"
          strokeWidth={1.5}
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
          stroke="var(--color-latencyMs)"
          connectNulls={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
