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

interface Player {
  id: string;
  name: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lastPlayedAt: string | null;
}

interface CurrentUser {
  id: string;
  username: string;
  isAdmin: boolean;
  requiresPasswordChange: boolean;
}

export default function SpikeballPage() {
  const { theme, setTheme } = useTheme();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/check?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          id: data.user.userId,
          username: data.user.username,
          isAdmin: data.user.isAdmin,
          requiresPasswordChange: Boolean(data.user.requiresPasswordChange),
        });
        if (data.user.requiresPasswordChange) {
          setShowPasswordDialog(true);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Fetch pending friend requests count
  const fetchPendingFriendRequests = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/friends/pending-count");
      if (res.ok) {
        const data = await res.json();
        setPendingFriendRequests(data.count);
      }
    } catch (error) {
      console.error("Error fetching pending friend requests:", error);
    }
  }, [user]);

  // Check auth on mount and when page becomes visible
  useEffect(() => {
    refreshAuth();

    // Also check auth when page becomes visible (e.g., after redirect from login)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshAuth();
        fetchPendingFriendRequests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshAuth, fetchPendingFriendRequests]);

  // Fetch pending friend requests periodically
  useEffect(() => {
    if (!user) return;
    fetchPendingFriendRequests();
    const interval = setInterval(fetchPendingFriendRequests, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, fetchPendingFriendRequests]);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch (err) {
      console.error("Error fetching players:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers, refreshTrigger]);

  const handlePlayersChange = useCallback(() => {
    fetchPlayers();
    setRefreshTrigger((prev) => prev + 1);
  }, [fetchPlayers]);

  const handleGameRecorded = useCallback(() => {
    fetchPlayers();
    setRefreshTrigger((prev) => prev + 1);
  }, [fetchPlayers]);

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
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: 'include',
    });
    setUser(null);
    setPendingFriendRequests(0);
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
    { value: "players", label: "Spieler", icon: Users },
    ...(user?.isAdmin ? [{ value: "admin", label: "Admin", icon: Settings }] : []),
  ];

  const tabItems = user ? fullTabs : guestTabs;

  if (loading) {
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

        {/* Desktop Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden sm:inline-flex w-full justify-start rounded-lg bg-muted p-1 h-auto">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
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
            <Leaderboard onRefreshTrigger={refreshTrigger} currentUser={user} />
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
                onRefreshTrigger={refreshTrigger}
                onGameDeleted={handleGameRecorded}
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

          <TabsContent value="players" className="mt-6">
            {user ? (
              <PlayersTabUpdated
                players={players}
                onPlayersChange={handlePlayersChange}
                isAdmin={user.isAdmin}
                currentUsername={user.username}
              />
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um Spieler zu verwalten.
                </p>
                <Button onClick={() => setAuthModalOpen(true)}>
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            {user?.isAdmin ? (
              <AdminTools onRefresh={handlePlayersChange} />
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
          await refreshAuth();
          await fetchPlayers();
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      <ChangePasswordDialog
        open={showPasswordDialog}
        isFirstLogin={Boolean(user?.requiresPasswordChange)}
        onOpenChange={setShowPasswordDialog}
        onSuccess={() => {
          setShowPasswordDialog(false);
          setUser((prev) => (prev ? { ...prev, requiresPasswordChange: false } : null));
        }}
      />
    </div>
  );
}