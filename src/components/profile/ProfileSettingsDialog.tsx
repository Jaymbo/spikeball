'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { AvatarUpload } from './AvatarUpload';

interface ProfileSettingsDialogProps {
  open: boolean;
  playerId: string;
  currentName: string;
  currentProfilePicture?: string | null;
  onNameChange: (newName: string) => void;
  onProfilePictureChange: (newPath: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ 
  open, 
  playerId, 
  currentName, 
  currentProfilePicture,
  onNameChange,
  onProfilePictureChange,
  onOpenChange 
}: ProfileSettingsDialogProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.length < 2 || name.length > 30) {
      toast.error('Name muss zwischen 2 und 30 Zeichen lang sein');
      return;
    }

    if (name === currentName) {
      toast.error('Der neue Name muss vom aktuellen abweichen');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Fehler beim Ändern des Namens');
        setIsLoading(false);
        return;
      }

      toast.success('Name erfolgreich geändert!');
      onNameChange(name);
      onOpenChange(false);
      setIsLoading(false);
    } catch (error) {
      toast.error('Fehler beim Ändern des Namens');
      setIsLoading(false);
    }
  };

  const handlePasswordSuccess = () => {
    setPasswordDialogOpen(false);
    toast.success('Passwort erfolgreich geändert!');
  };

  const handleUploadSuccess = (newPath: string) => {
    onProfilePictureChange(newPath);
    toast.success('Profilbild erfolgreich hochgeladen!');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil-Einstellungen</DialogTitle>
            <DialogDescription>
              Ändere dein Profilbild, deinen Namen oder dein Passwort
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profilbild</TabsTrigger>
              <TabsTrigger value="name">Name</TabsTrigger>
              <TabsTrigger value="password">Passwort</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Hier kannst du dein Profilbild hochladen.
                </p>
                <AvatarUpload 
                  playerId={playerId} 
                  onSuccess={handleUploadSuccess}
                />
              </div>
            </TabsContent>

            <TabsContent value="name" className="space-y-4">
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Neuer Name</Label>
                  <Input
                    id="name"
                    placeholder="Dein neuer Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    2-30 Zeichen
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Wird gespeichert...' : 'Name ändern'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="password" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Hier kannst du dein Passwort ändern.
                </p>
                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Passwort ändern
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onSuccess={handlePasswordSuccess}
      />
    </>
  );
}