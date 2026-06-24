"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Trophy,
  Swords,
  Shuffle,
  History,
  Users,
  UserCheck,
  Menu,
  X,
  Settings,
  LogOut,
  LogIn,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
import { toast } from "sonner";
import Leaderboard from "@/components/spikeball/Leaderboard";
import PlayersTabUpdated from "@/components/spikeball/PlayersTabUpdated";
import RecordGame from "@/components/spikeball/RecordGame";
import GenerateGames from "@/components/spikeball/GenerateGames";
import GameHistory from "@/components/spikeball/GameHistory";
import AdminTools from "@/components/spikeball/AdminTools";
import { FriendsTab } from "@/components/friends/FriendsTab";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { usePlayers, useInvalidatePlayers } from "@/hooks/use-players";
import { usePendingFriendRequests } from "@/hooks/use-friends";

export default function SpikeballPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  // React Query Hooks - ersetzen das Polling
  const { user, isLoading: isAuthLoading, logout, invalidateAuth } = useAuth();
  const { data: players = [], isLoading: isPlayersLoading } = usePlayers();
  const { data: pendingData } = usePendingFriendRequests();
  const invalidatePlayers = useInvalidatePlayers();

  const pendingFriendRequests = pendingData?.count || 0;

  useEffect(() => {
    setThemeReady(true);
  }, []);

  // Check if password change is required
  useEffect(() => {
    if (user?.requiresPasswordChange) {
      setShowPasswordDialog(true);
    }
  }, [user?.requiresPasswordChange]);

  const handlePlayersChange = useCallback(() => {
    invalidatePlayers();
  }, [invalidatePlayers]);

  const handleGameRecorded = useCallback(() => {
    invalidatePlayers();
  }, [invalidatePlayers]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Wird geladen...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    logout();
    toast.success("Erfolgreich abgemeldet");
  };

  // Guest tabs (without auth)
  const guestTabs = [
    { value: "leaderboard", label: "Rangliste", icon: Trophy },
  ];

  // Full tabs (with auth)
  const fullTabs = [
    { value: "leaderboard", label: "Rangliste", icon: Trophy },
    { value: "record", label: "Spiel eintragen", icon: Swords },
    { value: "generate", label: "Matchups", icon: Shuffle },
    { value: "history", label: "Verlauf", icon: History },
    { value: "friends", label: "Freunde", icon: UserCheck },

    ...(user?.isAdmin ? [
      { value: "players", label: "Spieler", icon: Users },
      { value: "admin", label: "Admin", icon: Settings }
    ] : []),
  ];

  const tabItems = user ? fullTabs : guestTabs;

  if (isPlayersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-background to-amber-50 dark:from-orange-950/20 dark:via-background dark:to-amber-950/20">
        <div className="text-center text-muted-foreground">
          <div className="h-12 w-12 mx-auto mb-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p>Lade Spikeball ELO System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-background to-amber-50 dark:from-orange-950/20 dark:via-background dark:to-amber-950/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-sm">
              <Image
                src="/spikeball-logo.png"
                alt="Spikeball"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Spikeball ELO</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Individual Rating System für 2v2 Matches
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{players.length} Spieler</span>
            </div>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Dark Mode umschalten"
              aria-label="Dark Mode umschalten"
            >
              {themeReady && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {user ? (
              <>
                <div className="text-right text-xs border-r pr-3">
                  <div className="font-medium">{user.username}</div>
                  {user.isAdmin && <div className="text-amber-500">Admin</div>}
                </div>
                <button
                  onClick={() => setShowPasswordDialog(true)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Passwort ändern"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Anmelden</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Mobile Tab Navigation */}
        <div className="block sm:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-between w-full p-3 rounded-lg border bg-card text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              {tabItems.find((t) => t.value === activeTab) && (
                <>
                  {(() => {
                    const TabIcon = tabItems.find((t) => t.value === activeTab)?.icon || Menu;
                    return <TabIcon className="h-4 w-4" />;
                  })()}
                  {tabItems.find((t) => t.value === activeTab)?.label}
                </>
              )}
            </span>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          {mobileMenuOpen && (
            <div className="mt-2 rounded-lg border bg-card p-2 space-y-1">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setActiveTab(tab.value);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full p-2.5 rounded-md text-sm transition-colors ${
                      activeTab === tab.value
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tablet Tab Navigation (Compact Horizontal Bar) */}
        <div className="hidden sm:flex lg:hidden mb-4 overflow-x-auto -mx-4 px-4">
          <div className="inline-flex gap-1 rounded-lg bg-muted/50 border p-1 min-w-max">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-1.5 rounded-md transition-colors text-xs px-2.5 py-2 ${
                    activeTab === tab.value
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.value === "friends" && pendingFriendRequests > 0 && (
                    <Badge variant="destructive" className="ml-0.5 h-4 px-1 text-[10px]">
                      {pendingFriendRequests}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden lg:flex w-full justify-center gap-1 rounded-xl bg-muted/50 border p-1.5">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 lg:flex-none lg:w-auto flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm lg:text-base lg:px-4"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.value === "friends" && pendingFriendRequests > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                      {pendingFriendRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard onRefreshTrigger={0} currentUser={user} />
          </TabsContent>

          <TabsContent value="record" className="mt-6">
            {user ? (
              <RecordGame players={players} onGameRecorded={handleGameRecorded} />
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um Spiele einzutragen.
                </p>
                <Button onClick={() => setAuthModalOpen(true)}>
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            {user ? (
              <GenerateGames players={players} />
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um Matchups zu generieren.
                </p>
                <Button onClick={() => setAuthModalOpen(true)}>
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {user ? (
              <GameHistory
                onRefreshTrigger={0}
                onGameDeleted={handleGameRecorded}
                isAdmin={user.isAdmin}
              />
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um den Spielverlauf zu sehen.
                </p>
                <Button onClick={() => setAuthModalOpen(true)}>
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="mt-6">
            {user ? (
              <FriendsTab currentUser={user} />
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um Freunde zu verwalten.
                </p>
                <Button onClick={() => setAuthModalOpen(true)}>
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="mt-6">
            {user ? (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  ELO-Vergleich ist verfügbar unter <a href="/compare" className="text-primary hover:underline">/compare</a>
                </p>
                <Button onClick={() => window.location.href = '/compare'}>
                  Zum Vergleich
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um ELO-Verläufe zu vergleichen.
                </p>
                <Button onClick={() => setAuthModalOpen(true)}>
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="mt-6">
            {user?.isAdmin ? (
              <PlayersTabUpdated
                players={players}
                onPlayersChange={handlePlayersChange}
                isAdmin={user.isAdmin}
                currentUsername={user.username}
              />
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du hast keine Admin-Berechtigung für diese Seite.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            {user?.isAdmin ? (
              <AdminTools onRefresh={handlePlayersChange} players={players} />
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du hast keine Admin-Berechtigung für diese Seite.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Spikeball ELO Rating System</span>
          <span>ELO-Decay: 5% pro inaktivem Monat</span>
        </div>
      </footer>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={async () => {
          invalidateAuth();
        }}
      />

      <ChangePasswordDialog
        open={showPasswordDialog}
        isFirstLogin={Boolean(user?.requiresPasswordChange)}
        onOpenChange={setShowPasswordDialog}
        onSuccess={() => {
          setShowPasswordDialog(false);
          invalidateAuth();
        }}
      />
    </div>
  );
}