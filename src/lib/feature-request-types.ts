export type FeatureRequestType = "bug" | "feature";
export type FeatureRequestStatus = "open" | "in_progress" | "done" | "rejected";
export type FeatureRequestPriority = "low" | "medium" | "high";

export interface FeatureRequest {
  id: string;
  userId: string | null;
  type: FeatureRequestType;
  title: string;
  description: string;
  status: FeatureRequestStatus;
  priority: FeatureRequestPriority;
  createdAt: string;
  updatedAt: string;
  user?: {
    username: string;
    player?: {
      name: string;
    };
  };
}

export interface CreateFeatureRequestInput {
  type: FeatureRequestType;
  title: string;
  description: string;
}

export interface UpdateFeatureRequestInput {
  status?: FeatureRequestStatus;
  priority?: FeatureRequestPriority;
}