"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";

interface EloHistoryEntry {
  id: string;
  previousRating: number;
  newRating: number;
  change: number;
  createdAt: string;
  game: {
    id: string;
    team1Score: number;
    team2Score: number;
    playedAt: string;
  } | null;
}

interface EloHistoryChartProps {
  eloHistory: EloHistoryEntry[];
  playerName?: string;
  color?: string;
  showLegend?: boolean;
}

export function EloHistoryChart({ eloHistory, playerName = "ELO", color = "#f97316", showLegend = true }: EloHistoryChartProps) {
  // Prepare data for chart - reverse to show chronological order
  const chartData = eloHistory
    .slice()
    .reverse()
    .map((entry, index) => ({
      index: index + 1,
      rating: entry.newRating,
      date: new Date(entry.createdAt).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }),
      change: entry.change,
      gameId: entry.game?.id,
    }));

  // Calculate statistics
  const latestRating = eloHistory.length > 0 ? eloHistory[0].newRating : 1000;
  const initialRating = eloHistory.length > 0 ? eloHistory[eloHistory.length - 1].previousRating : 1000;
  const totalChange = latestRating - initialRating;
  const gamesPlayed = eloHistory.length;

  const chartConfig = {
    rating: {
      label: playerName,
      color: color,
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Noch keine ELO-Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="text-sm text-muted-foreground mb-1">Aktuelles ELO</div>
          <div className="text-2xl font-bold" style={{ color }}>
            {latestRating.toFixed(1)}
          </div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="text-sm text-muted-foreground mb-1">Gesamtveränderung</div>
          <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
            totalChange >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            {totalChange >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {totalChange >= 0 ? "+" : ""}
            {totalChange.toFixed(1)}
          </div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <div className="text-sm text-muted-foreground mb-1">Spiele</div>
          <div className="text-2xl font-bold">{gamesPlayed}</div>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="index"
              tickFormatter={(value) => `#${value}`}
              className="text-xs"
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(value) => value.toFixed(0)}
              className="text-xs"
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)} ELO`,
                playerName,
              ]}
              labelFormatter={(label, payload) => {
                const entry = payload?.[0]?.payload;
                if (!entry) return `Spiel #${label}`;
                return (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Spiel #{label}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                );
              }}
            />
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                content={({ payload }) => (
                  <div className="flex items-center justify-center gap-2">
                    {payload?.map((entry: any) => (
                      <div key={entry.value} className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
            )}
            <Line
              type="monotone"
              dataKey="rating"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
              name={playerName}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}