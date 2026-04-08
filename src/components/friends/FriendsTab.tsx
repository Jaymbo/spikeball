"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddFriendDialog } from "./AddFriendDialog";
import { FriendList } from "./FriendList";
import { FriendRequests } from "./FriendRequests";
import { SentRequests } from "./SentRequests";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Clock, Send } from "lucide-react";

interface FriendsTabProps {
  currentUser: {
    id: string;
    username: string;
    isAdmin: boolean;
    requiresPasswordChange: boolean;
  };
}

export function FriendsTab({ currentUser }: FriendsTabProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const updatePendingCount = (count: number) => {
    setPendingRequests(count);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Freunde
            {pendingRequests > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                {pendingRequests}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Verwalte deine Freundschaften und Anfragen
            {pendingRequests > 0 && " - Neue Anfrage vorhanden!"}
          </p>
        </div>
        <AddFriendDialog onSuccess={handleRefresh} />
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Freunde
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Eingehend
            {pendingRequests > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingRequests}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Ausgehend
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <FriendList
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <FriendRequests
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
            onPendingCountChange={updatePendingCount}
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <SentRequests
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}