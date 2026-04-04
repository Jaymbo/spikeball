"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddFriendDialog } from "./AddFriendDialog";
import { FriendList } from "./FriendList";
import { FriendRequests } from "./FriendRequests";

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

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Freunde</h2>
          <p className="text-muted-foreground">
            Verwalte deine Freundschaften und Anfragen
          </p>
        </div>
        <AddFriendDialog onSuccess={handleRefresh} />
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">Meine Freunde</TabsTrigger>
          <TabsTrigger value="requests">Anfragen</TabsTrigger>
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}