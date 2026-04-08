'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
  playerId: string;
  currentImage?: string | null;
  onSuccess: (path: string) => void;
}

export function AvatarUpload({ playerId, currentImage, onSuccess }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Die Datei ist zu groß (max 5MB)");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Nur JPEG, PNG und WebP Bilder sind erlaubt");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!preview || !fileInputRef.current?.files?.[0]) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileInputRef.current.files[0]);
      formData.append("playerId", playerId);

      const res = await fetch("/api/upload/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.path);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Upload fehlgeschlagen");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative mx-auto w-32 h-32">
          <Image
            src={preview}
            alt="Vorschau"
            fill
            className="object-cover rounded-full border-2 border-primary"
          />
        </div>
      )}

      <div className="flex justify-center gap-2">
        {!preview ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Bild auswählen
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? "Uploade..." : "Hochladen"}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
              Abbrechen
            </Button>
          </>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p>Maximal 5MB</p>
        <p>Formate: JPEG, PNG, WebP</p>
      </div>
    </div>
  );
}
