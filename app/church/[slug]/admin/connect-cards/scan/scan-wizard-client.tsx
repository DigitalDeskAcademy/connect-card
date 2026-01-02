"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  RotateCcw,
  Check,
  AlertCircle,
  FlipHorizontal,
  Square,
  Layers,
  MapPin,
  Lock,
  SlidersHorizontal,
  Info,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useCamera } from "@/hooks/use-camera";
import {
  useAsyncCardProcessor,
  CapturedImage,
} from "@/hooks/use-async-card-processor";
import {
  ProcessingStatsDisplay,
  QueueDrawer,
  SessionRecoveryDialog,
} from "@/components/dashboard/connect-cards/scan";

// Wizard steps - simplified for continuous scanning
type WizardStep =
  | "setup" // Select card type and location
  | "capture-front" // Live viewfinder for front
  | "preview-front" // Review front capture
  | "capture-back" // Live viewfinder for back (2-sided only)
  | "preview-back"; // Review back capture (2-sided only)

type CardType = "single" | "double";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface ScanWizardClientProps {
  slug: string;
  locations: Location[];
  defaultLocationId: string | null;
  scanToken?: string; // Token from QR code scan (for phone auth)
}

// Session storage key for setup preferences
const SETUP_SESSION_KEY = "connect-card-scan-setup";

interface SetupSession {
  cardType: CardType;
  locationId: string;
}

// Helper to get initial setup from sessionStorage (client-side only)
function getInitialSetup(
  defaultLocationId: string | null,
  firstLocationId: string
): { cardType: CardType; locationId: string } {
  if (typeof window === "undefined") {
    return {
      cardType: "single",
      locationId: defaultLocationId || firstLocationId,
    };
  }
  try {
    const saved = sessionStorage.getItem(SETUP_SESSION_KEY);
    if (saved) {
      const setup: SetupSession = JSON.parse(saved);
      return {
        cardType: setup.cardType || "single",
        locationId: setup.locationId || defaultLocationId || firstLocationId,
      };
    }
  } catch {
    // Invalid session, use defaults
  }
  return {
    cardType: "single",
    locationId: defaultLocationId || firstLocationId,
  };
}

export function ScanWizardClient({
  slug,
  locations,
  defaultLocationId,
  scanToken,
}: ScanWizardClientProps) {
  const router = useRouter();

  // Get initial values (only runs once on mount)
  const initialSetup = getInitialSetup(
    defaultLocationId,
    locations[0]?.id || ""
  );

  // Wizard state - initialized from sessionStorage
  const [step, setStep] = useState<WizardStep>("setup");
  const [cardType, setCardType] = useState<CardType>(initialSetup.cardType);
  const [locationId, setLocationId] = useState<string>(initialSetup.locationId);

  // Captured images (current card being captured)
  const [frontImage, setFrontImage] = useState<CapturedImage | null>(null);
  const [backImage, setBackImage] = useState<CapturedImage | null>(null);

  // Queue drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Async card processor hook
  const processor = useAsyncCardProcessor({
    slug,
    locationId,
    onCardComplete: () => {
      // Card completed - could track for analytics
    },
    onFailure: (itemId, error) => {
      // Show toast on failure
      const itemIndex = processor.items.findIndex(i => i.id === itemId);
      toast.error(`Card #${itemIndex + 1} failed`, {
        description: error,
        action: {
          label: "Retry",
          onClick: () => processor.retryCard(itemId),
        },
      });
    },
  });

  // Camera hook
  const {
    videoRef,
    canvasRef,
    state: cameraState,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
  } = useCamera();

  // Create scan session cookie on mount (for phone QR code flow)
  useEffect(() => {
    if (!scanToken) return;

    const createSession = async () => {
      try {
        await fetch("/api/scan/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: scanToken, slug }),
        });
      } catch {
        // Session creation failed - API calls may fail
      }
    };

    createSession();
  }, [scanToken, slug]);

  // Save setup preferences when they change
  const saveSetupPreferences = useCallback(() => {
    const setup: SetupSession = { cardType, locationId };
    sessionStorage.setItem(SETUP_SESSION_KEY, JSON.stringify(setup));
  }, [cardType, locationId]);

  // Start camera when entering capture step
  useEffect(() => {
    if (step === "capture-front" || step === "capture-back") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [step, startCamera, stopCamera]);

  // Handle capture button press - crops to card alignment guide
  const handleCapture = async () => {
    const result = await captureImage(true);
    if (!result) {
      toast.error("Failed to capture image");
      return;
    }

    if (step === "capture-front") {
      setFrontImage(result);
      setStep("preview-front");
    } else if (step === "capture-back") {
      setBackImage(result);
      setStep("preview-back");
    }
  };

  // Handle retake - go back to capture
  const handleRetake = () => {
    if (step === "preview-front") {
      setFrontImage(null);
      setStep("capture-front");
    } else if (step === "preview-back") {
      setBackImage(null);
      setStep("capture-back");
    }
  };

  // Handle accept - add to processing queue and continue scanning
  const handleAccept = () => {
    if (step === "preview-front") {
      if (cardType === "double") {
        // Two-sided card: capture back next
        setStep("capture-back");
      } else {
        // Single-sided card: add to queue and reset for next card
        addToQueue(frontImage!, null);
      }
    } else if (step === "preview-back") {
      // Two-sided card complete: add to queue and reset
      addToQueue(frontImage!, backImage!);
    }
  };

  // Add card to async processing queue
  const addToQueue = (front: CapturedImage, back: CapturedImage | null) => {
    processor.addCard(front, back);

    // Reset for next card
    setFrontImage(null);
    setBackImage(null);
    setStep("capture-front");
    toast.success("Card queued - keep scanning!");
  };

  // Start scanning - save preferences and move to camera
  const handleStartScanning = () => {
    saveSetupPreferences();
    setStep("capture-front");
  };

  // Finish batch and go to review
  const handleFinishBatch = () => {
    if (processor.batchInfo) {
      router.push(
        `/church/${slug}/admin/connect-cards/review/${processor.batchInfo.id}`
      );
    } else {
      router.push(`/church/${slug}/admin/connect-cards`);
    }
  };

  // Handle session recovery
  const handleResumeSession = () => {
    processor.resumeSession();
    // Go directly to capture mode after resuming
    setStep("capture-front");
  };

  const handleDiscardSession = () => {
    processor.discardSession();
  };

  // Computed values
  const canFinish =
    processor.stats.total > 0 &&
    !processor.isProcessing &&
    processor.stats.queued === 0;
  // All cards processed (complete, duplicate, or failed - none pending)
  const allComplete =
    processor.stats.total > 0 &&
    processor.stats.complete +
      processor.stats.duplicate +
      processor.stats.failed ===
      processor.stats.total;

  // Render based on current step
  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)]">
      {/* Session recovery dialog */}
      <SessionRecoveryDialog
        isOpen={processor.hasPendingSession}
        onResume={handleResumeSession}
        onDiscard={handleDiscardSession}
      />

      {/* Queue drawer */}
      <QueueDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={processor.items}
        onRetry={processor.retryCard}
        onRemove={processor.removeCard}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* SETUP STEP */}
        {step === "setup" && (
          <div className="flex-1 flex flex-col">
            {/* Back button - full width, top left */}
            <div className="p-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/church/${slug}/admin/connect-cards`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>

            {/* Centered content */}
            <div className="flex-1 flex flex-col justify-center space-y-6 px-6 pb-6 max-w-md mx-auto w-full">
              <div className="text-center mb-4">
                <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-semibold mb-2">
                  Ready to Scan Cards
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configure your scanning session
                </p>
              </div>

              {/* Card Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Card Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={cardType === "single" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setCardType("single")}
                  >
                    <Square className="h-6 w-6" />
                    <span className="text-xs">1-Sided</span>
                  </Button>
                  <Button
                    variant={cardType === "double" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setCardType("double")}
                  >
                    <Layers className="h-6 w-6" />
                    <span className="text-xs">2-Sided</span>
                  </Button>
                </div>
              </div>

              {/* Location Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Button */}
              <Button
                size="lg"
                className="w-full mt-6"
                onClick={handleStartScanning}
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>

              {/* Resume indicator (if has batch info from previous session) */}
              {processor.batchInfo && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Resuming batch: &quot;{processor.batchInfo.name}&quot; (
                    {processor.stats.complete} cards complete)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* CAPTURE STEPS (front and back) */}
        {(step === "capture-front" || step === "capture-back") && (
          <div className="flex-1 flex flex-col">
            {/* Camera not supported error */}
            {!cameraState.isSupported && (
              <div className="flex-1 flex items-center justify-center p-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Camera is not supported on this device or browser.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Camera error */}
            {cameraState.error && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 max-w-md mx-auto">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{cameraState.error}</AlertDescription>
                </Alert>
                {cameraState.error.includes("permission") && (
                  <div className="text-sm text-muted-foreground text-center space-y-2">
                    <p>To allow camera access:</p>
                    <ol className="text-left list-decimal list-inside space-y-1">
                      <li>
                        Click the lock <Lock className="h-3.5 w-3.5 inline" />,
                        tune{" "}
                        <SlidersHorizontal className="h-3.5 w-3.5 inline" />, or
                        info <Info className="h-3.5 w-3.5 inline" /> icon in
                        your address bar
                      </li>
                      <li>Select &quot;Site settings&quot; if needed</li>
                      <li>
                        Find &quot;Camera&quot; and set it to &quot;Allow&quot;
                      </li>
                      <li>Refresh the page</li>
                    </ol>
                  </div>
                )}
                <Button onClick={startCamera}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Live viewfinder */}
            {cameraState.isSupported && !cameraState.error && (
              <>
                {/* Header row with back button, card indicator, stats, and done button */}
                <div className="flex items-center justify-between px-4 mb-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/church/${slug}/admin/connect-cards`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Link>
                  </Button>

                  {/* Center: Current card indicator */}
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium">
                      {processor.stats.total > 0
                        ? `Card #${processor.stats.total + 1}`
                        : step === "capture-front"
                          ? cardType === "double"
                            ? "Front of Card"
                            : "Capture Card"
                          : "Back of Card"}
                    </div>

                    {/* Compact stats - tappable to open drawer */}
                    <ProcessingStatsDisplay
                      stats={processor.stats}
                      isProcessing={processor.isProcessing}
                      onClick={() => setIsDrawerOpen(true)}
                    />
                  </div>

                  {/* Right: Done button */}
                  {processor.stats.total > 0 ? (
                    <Button
                      size="sm"
                      onClick={handleFinishBatch}
                      disabled={!canFinish}
                      variant={allComplete ? "default" : "outline"}
                      className={allComplete ? "animate-pulse" : ""}
                    >
                      {allComplete ? "Review Batch" : "Done"}
                    </Button>
                  ) : (
                    <div className="w-24" />
                  )}
                </div>

                {/* Video element */}
                <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Dark mask overlay - hides area outside card bounds */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="w-[85%] aspect-[3/2] border-2 border-white rounded-lg relative"
                      style={{
                        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 1)",
                      }}
                    >
                      <p className="absolute bottom-3 left-0 right-0 text-center text-white/80 text-sm">
                        Align card within frame
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera controls */}
                <div className="bg-black/90 p-6 flex items-center justify-center gap-8">
                  {/* Switch camera */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white h-12 w-12"
                    onClick={switchCamera}
                  >
                    <FlipHorizontal className="h-6 w-6" />
                  </Button>

                  {/* Capture button */}
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                    onClick={handleCapture}
                    disabled={!cameraState.isActive}
                  >
                    <div className="h-12 w-12 rounded-full border-4 border-primary-foreground" />
                  </Button>

                  {/* Placeholder for symmetry */}
                  <div className="h-12 w-12" />
                </div>
              </>
            )}
          </div>
        )}

        {/* PREVIEW STEPS (front and back) */}
        {(step === "preview-front" || step === "preview-back") && (
          <div className="flex-1 flex flex-col">
            {/* Preview image */}
            <div className="flex-1 relative bg-black">
              {(step === "preview-front" ? frontImage : backImage) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    (step === "preview-front" ? frontImage : backImage)?.dataUrl
                  }
                  alt={`${step === "preview-front" ? "Front" : "Back"} of card`}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}

              {/* Step indicator */}
              <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
                <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {step === "preview-front"
                    ? cardType === "double"
                      ? "Review Front"
                      : "Review Card"
                    : "Review Back"}
                </div>
              </div>
            </div>

            {/* Accept/Retake controls */}
            <div className="bg-background p-6 flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 max-w-32"
                onClick={handleRetake}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button
                size="lg"
                className="flex-1 max-w-32"
                onClick={handleAccept}
              >
                <Check className="mr-2 h-4 w-4" />
                Accept
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
