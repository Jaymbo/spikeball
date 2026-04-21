"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Lightbulb, Bug } from "lucide-react";
import { FeatureRequestForm } from "./FeatureRequestForm";
import { useAuth } from "@/hooks/use-auth";

export function FeatureRequestChatWidget() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const handleSuccess = () => {
    setOpen(false);
  };

  // Nicht anzeigen wenn nicht authentifiziert oder lädt
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback & Feature Requests
            </DialogTitle>
            <DialogDescription>
              Hast du einen Bug gefunden oder ein Feature-Idee? Schreib uns!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <Lightbulb className="h-3 w-3" />
                Feature
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Bug className="h-3 w-3" />
                Bug Report
              </Badge>
            </div>

            <FeatureRequestForm 
              onSuccess={handleSuccess}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}