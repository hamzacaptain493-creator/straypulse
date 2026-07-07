import { createFileRoute } from "@tanstack/react-router";
import { Camera, QrCode, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_app/scan")({
  component: ScanPage,
});

function ScanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
          <QrCode className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">QR Code Scanner</h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          Scan QR codes on animal tags to view their profiles and health
          information.
        </p>
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16">
          <Camera className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Point your camera at a StrayPulse tag
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1">
            <Camera className="mr-2 h-4 w-4" />
            Start Scanner
          </Button>
          <Button variant="outline" className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Upload QR Image
          </Button>
        </div>
      </Card>
    </div>
  );
}
