import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bug, Lightbulb, Trash2, CheckCircle, Clock, XCircle, MessageSquare } from "lucide-react";
import type { FeatureRequest } from "@/lib/feature-request-types";

export function FeatureRequestsAdmin() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const url = filter === "all" 
        ? "/api/feature-requests" 
        : `/api/feature-requests?status=${filter}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Fehler beim Laden");
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/feature-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Fehler beim Aktualisieren");
      fetchRequests();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const updatePriority = async (id: string, priority: string) => {
    try {
      const response = await fetch(`/api/feature-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (!response.ok) throw new Error("Fehler beim Aktualisieren");
      fetchRequests();
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Möchtest du diesen Request wirklich löschen?")) return;
    
    try {
      const response = await fetch(`/api/feature-requests/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Fehler beim Löschen");
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; label: string; variant: string }> = {
      open: { icon: Clock, label: "Offen", variant: "default" },
      in_progress: { icon: Lightbulb, label: "In Arbeit", variant: "secondary" },
      done: { icon: CheckCircle, label: "Erledigt", variant: "outline" },
      rejected: { icon: XCircle, label: "Abgelehnt", variant: "destructive" },
    };
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; color: string }> = {
      low: { label: "Niedrig", color: "bg-gray-500" },
      medium: { label: "Mittel", color: "bg-yellow-500" },
      high: { label: "Hoch", color: "bg-red-500" },
    };
    const config = priorityConfig[priority] || priorityConfig.low;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-8">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Feature Requests & Bug Reports</h3>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="open">Offen</SelectItem>
            <SelectItem value="in_progress">In Arbeit</SelectItem>
            <SelectItem value="done">Erledigt</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Keine Feature Requests gefunden
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {request.type === "bug" ? (
                        <Bug className="h-5 w-5 text-red-500" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                      )}
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                    </div>
                    <CardDescription>
                      Von {request.user?.username || "Anonym"} •{" "}
                      {new Date(request.createdAt).toLocaleDateString("de-DE")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{request.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={request.status}
                    onValueChange={(value) => updateStatus(request.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Offen</SelectItem>
                      <SelectItem value="in_progress">In Arbeit</SelectItem>
                      <SelectItem value="done">Erledigt</SelectItem>
                      <SelectItem value="rejected">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={request.priority}
                    onValueChange={(value) => updatePriority(request.id, value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteRequest(request.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}