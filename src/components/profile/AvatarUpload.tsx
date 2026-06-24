'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Crop as CropIcon } from "lucide-react";
import Image from "next/image";
import ReactCrop, { type Crop as CropType, PixelCrop } from "react-image-crop";
import { useInvalidatePlayers } from "@/hooks/use-players";
import "react-image-crop/dist/ReactCrop.css";

interface AvatarUploadProps {
  playerId: string;
  currentImage?: string | null;
  onSuccess: (path: string) => void;
}

export function AvatarUpload({ playerId, currentImage, onSuccess }: AvatarUploadProps) {
  const invalidatePlayers = useInvalidatePlayers();
  const [preview, setPreview] = useState<string | null>(null);
  // aspect wird nicht als Property im crop-Objekt verwendet
  const [crop, setCrop] = useState<CropType>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [uploading, setUploading] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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
      // Reset crop state for new image
      setCrop({
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10,
      });
      setCompletedCrop(null);
      setCroppedImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setPreview(null);
    setCrop({
      unit: '%',
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });
    setCompletedCrop(null);
    setCroppedImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop, _fileName: string): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No canvas context');
    }
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas to Blob failed');
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'cropped-avatar.jpg'
      );
      
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setCroppedImageUrl(croppedUrl);
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Crop fehlgeschlagen');
    }
  };

  const handleUpload = async () => {
    if (!preview || !completedCrop || !imgRef.current) return;

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'cropped-avatar.jpg'
      );
      
      const formData = new FormData();
      formData.append("file", croppedBlob, `avatar-${playerId}.jpg`);
      formData.append("playerId", playerId);

      const res = await fetch("/api/upload/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.path);
        invalidatePlayers();
        setPreview(null);
        setCrop({
          unit: '%',
          width: 100,
          height: 100,
          x: 0,
          y: 0,
        });
        setCompletedCrop(null);
        setCroppedImageUrl('');
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
        <div className="space-y-4">
          {/* Original Image with Crop Overlay */}
          <div className="flex justify-center">
            <div className="relative max-w-sm">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                keepSelection
                className="w-full"
              >
                <img
                  ref={imgRef}
                  alt="Upload preview"
                  src={preview}
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </ReactCrop>
            </div>
          </div>

          {/* Cropped Preview */}
          { croppedImageUrl && (
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <Image
                  src={croppedImageUrl}
                  alt="Cropped preview"
                  fill
                  className="object-cover rounded-full border-2 border-primary"
                />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2">
            {!croppedImageUrl ? (
              <>
                <Button
                  onClick={handleCrop}
                  className="flex items-center gap-2"
                >
                  <CropIcon className="h-4 w-4" />
                  Zuschneiden
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                  Abbrechen
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
                  onClick={() => setCroppedImageUrl('')}
                  variant="outline"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                  Neu zuschneiden
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {!preview && (
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
            className="flex items-center gap-2 w-full"
          >
            <Upload className="h-4 w-4" />
            Bild auswählen
          </Button>
        </>
      )}

      <div className="text-xs text-muted-foreground text-center">
        <p>Maximal 5MB</p>
        <p>Formate: JPEG, PNG, WebP</p>
        <p>Wähle einen quadratischen Ausschnitt für dein Profilbild</p>
      </div>
    </div>
  );
}
