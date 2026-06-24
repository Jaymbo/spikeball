import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Diese Seite konnte nicht gefunden werden.
      </p>
      <Button asChild>
        <Link href="/">Zurück zur Startseite</Link>
      </Button>
    </div>
  );
}
