"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bug, Lightbulb, Send, X } from "lucide-react";
import type { FeatureRequestType } from "@/lib/feature-request-types";

interface FeatureRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FeatureRequestForm({ onSuccess, onCancel }: FeatureRequestFormProps) {
  const [type, setType] = useState<FeatureRequestType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feature-requests/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Senden");
      }

      toast.success("Feature Request erfolgreich gesendet!");
      setTitle("");
      setDescription("");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting feature request:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Senden");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Typ Auswahl */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Typ</label>
        <Select value={type} onValueChange={(value: FeatureRequestType) => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feature">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Feature Request
              </div>
            </SelectItem>
            <SelectItem value="bug">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Bug Report
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Titel */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Titel</label>
        <Input
          placeholder="Kurze Beschreibung..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
        />
        <div className="text-xs text-muted-foreground text-right">
          {title.length}/100
        </div>
      </div>

      {/* Beschreibung */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Beschreibung</label>
        <Textarea
          placeholder="Bitte beschreibe das Feature oder den Bug so detailliert wie möglich..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={5}
          required
        />
        <div className="text-xs text-muted-foreground text-right">
          {description.length}/1000
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Abbrechen
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !title.trim() || !description.trim()}
          className="flex-1"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Senden..." : "Senden"}
        </Button>
      </div>
    </form>
  );
}