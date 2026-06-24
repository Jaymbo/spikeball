"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { PlayerEloData } from "./types";

interface EloComparisonChartProps {
  players: PlayerEloData[];
  onRemovePlayer?: (playerId: string) => void;
}

const COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#8b5cf6", // purple
  "#eab308", // yellow
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export function EloComparisonChart({ players, onRemovePlayer }: EloComparisonChartProps) {
  // Assign colors to players
  const playersWithColors = players.map((player, index) => ({
    ...player,
    color: player.color || COLORS[index % COLORS.length],
  }));

  // Find the maximum number of games across all players
  const maxGames = Math.max(...playersWithColors.map(p => p.eloHistory.length));

  // Prepare chart data - align all players by game index
  const chartData = Array.from({ length: maxGames }, (_, index) => {
    const dataPoint: Record<string, number | string | null> = {
      index: index + 1,
    };

    playersWithColors.forEach(player => {
      const entry = player.eloHistory[player.eloHistory.length - 1 - index];
      if (entry) {
        dataPoint[player.playerId] = entry.newRating;
        dataPoint[`${player.playerId}_date`] = new Date(entry.createdAt).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
        dataPoint[`${player.playerId}_change`] = entry.change;
      } else {
        dataPoint[player.playerId] = null;
      }
    });

    return dataPoint;
  }).reverse();

  // Build chart config
  const chartConfig = playersWithColors.reduce((acc, player) => {
    acc[player.playerId] = {
      label: player.playerName,
      color: player.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Wähle Spieler zum Vergleichen aus</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Player List with Remove Buttons */}
      <div className="flex flex-wrap gap-2">
        {playersWithColors.map((player) => (
          <div
            key={player.playerId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background"
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            <span className="text-sm font-medium">{player.playerName}</span>
            {onRemovePlayer && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-destructive/10"
                onClick={() => onRemovePlayer(player.playerId)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
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
              formatter={(value: number, name: string) => {
                const player = playersWithColors.find(p => p.playerId === name);
                if (!player || value === null) return [null, null];
                return [`${value.toFixed(1)} ELO`, player.playerName];
              }}
              labelFormatter={(label, payload) => {
                const entry = payload?.[0]?.payload;
                if (!entry) return `Spiel #${label}`;
                // Find the first player with data for this game
                const firstPlayerWithData = playersWithColors.find(p => entry[p.playerId] !== null);
                const date = firstPlayerWithData ? entry[`${firstPlayerWithData.playerId}_date`] : "";
                return (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Spiel #{label}</span>
                    {date && <span className="text-xs text-muted-foreground">{date}</span>}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              content={({ payload }) => (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {payload?.map((entry) => (
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
            {playersWithColors.map((player) => (
              <Line
                key={player.playerId}
                type="monotone"
                dataKey={player.playerId}
                stroke={player.color}
                strokeWidth={2}
                dot={{ fill: player.color, r: 3 }}
                activeDot={{ r: 5 }}
                name={player.playerId}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Statistics Table */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Spieler</th>
              <th className="px-4 py-2 text-right font-medium">Aktuelles ELO</th>
              <th className="px-4 py-2 text-right font-medium">Start ELO</th>
              <th className="px-4 py-2 text-right font-medium">Veränderung</th>
              <th className="px-4 py-2 text-right font-medium">Spiele</th>
            </tr>
          </thead>
          <tbody>
            {playersWithColors.map((player) => {
              const latestRating = player.eloHistory.length > 0 
                ? player.eloHistory[0].newRating 
                : 1000;
              const initialRating = player.eloHistory.length > 0 
                ? player.eloHistory[player.eloHistory.length - 1].previousRating 
                : 1000;
              const totalChange = latestRating - initialRating;
              const gamesPlayed = player.eloHistory.length;

              return (
                <tr key={player.playerId} className="border-b">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-medium">{player.playerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right font-bold">
                    {latestRating.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {initialRating.toFixed(1)}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${
                    totalChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {totalChange >= 0 ? "+" : ""}
                    {totalChange.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {gamesPlayed}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
