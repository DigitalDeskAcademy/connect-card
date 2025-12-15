"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
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
import { saveConnectCard } from "@/actions/connect-card/save-connect-card";
import { getActiveBatchAction } from "@/actions/connect-card/batch-actions";

// Type for extracted connect card data (matches Zod schema)
interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request: string | null;
  visit_status?: string | null;
  first_time_visitor?: boolean | null;
  interests: string[] | null;
  address: string | null;
  age_group: string | null;
  family_info: string | null;
  additional_notes: string | null;
}

// Wizard steps - simplified for continuous scanning
type WizardStep =
  | "setup" // Select card type and location
  | "capture-front" // Live viewfinder for front
  | "preview-front" // Review front capture
  | "capture-back" // Live viewfinder for back (2-sided only)
  | "preview-back"; // Review back capture (2-sided only)

type CardType = "single" | "double";

interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  file?: File;
}

// Queue item for background processing
type QueueStatus =
  | "pending"
  | "uploading"
  | "extracting"
  | "saving"
  | "complete"
  | "failed";

interface QueuedCard {
  id: string;
  frontImage: CapturedImage;
  backImage: CapturedImage | null;
  status: QueueStatus;
  error?: string;
}

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

// Session storage key for persistence
const SESSION_KEY = "connect-card-scan-session";

interface ScanSession {
  cardType: CardType;
  locationId: string;
  cardsScanned: number;
  batchId?: string;
  batchName?: string;
}

export function ScanWizardClient({
  slug,
  locations,
  defaultLocationId,
  scanToken,
}: ScanWizardClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("setup");
  const [cardType, setCardType] = useState<CardType>("single");
  const [locationId, setLocationId] = useState<string>(
    defaultLocationId || locations[0]?.id || ""
  );

  // Captured images (current card being captured)
  const [frontImage, setFrontImage] = useState<CapturedImage | null>(null);
  const [backImage, setBackImage] = useState<CapturedImage | null>(null);

  // Background processing queue
  const [queue, setQueue] = useState<QueuedCard[]>([]);
  const processingRef = useRef(false); // Lock to prevent concurrent processing

  // Session tracking
  const [cardsScanned, setCardsScanned] = useState(0);
  const [activeBatch, setActiveBatch] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
  // This enables subsequent API calls to authenticate via cookie
  useEffect(() => {
    if (!scanToken) return;

    const createSession = async () => {
      try {
        await fetch("/api/scan/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: scanToken, slug }),
        });
        // Cookie is now set - API calls will work
      } catch {
        // Session creation failed - API calls may fail
        // but page is already loaded so don't block
      }
    };

    createSession();
  }, [scanToken, slug]);

  // Restore session from storage on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const session: ScanSession = JSON.parse(savedSession);
        setCardType(session.cardType);
        setLocationId(session.locationId);
        setCardsScanned(session.cardsScanned);
        if (session.batchId && session.batchName) {
          setActiveBatch({ id: session.batchId, name: session.batchName });
        }
      } catch {
        // Invalid session, ignore
      }
    }
  }, []);

  // Save session to storage
  const saveSession = useCallback(() => {
    const session: ScanSession = {
      cardType,
      locationId,
      cardsScanned,
      batchId: activeBatch?.id,
      batchName: activeBatch?.name,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [cardType, locationId, cardsScanned, activeBatch]);

  // Save session when relevant state changes
  useEffect(() => {
    if (step !== "setup") {
      saveSession();
    }
  }, [cardsScanned, activeBatch, saveSession, step]);

  // Clear session
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setCardsScanned(0);
    setActiveBatch(null);
  }, []);

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
    // Capture image from camera
    const result = await captureImage();
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

  // Handle accept - add to queue and continue scanning
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

  // Add card to processing queue
  const addToQueue = (front: CapturedImage, back: CapturedImage | null) => {
    const newItem: QueuedCard = {
      id: crypto.randomUUID(),
      frontImage: front,
      backImage: back,
      status: "pending",
    };
    setQueue(prev => [...prev, newItem]);
    setCardsScanned(prev => prev + 1);

    // Reset for next card
    setFrontImage(null);
    setBackImage(null);
    setStep("capture-front");
    toast.success("Card queued - keep scanning!");
  };

  // Update queue item status
  const updateQueueItem = useCallback(
    (id: string, updates: Partial<QueuedCard>) => {
      setQueue(prev =>
        prev.map(item => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // Process a single queue item
  const processQueueItem = useCallback(
    async (item: QueuedCard) => {
      try {
        // Step 1: Upload front image
        updateQueueItem(item.id, { status: "uploading" });
        const frontKey = await uploadImage(item.frontImage.blob, "front");
        if (!frontKey) throw new Error("Failed to upload front image");

        // Step 2: Upload back image if exists
        let backKey: string | null = null;
        if (item.backImage) {
          backKey = await uploadImage(item.backImage.blob, "back");
          if (!backKey) throw new Error("Failed to upload back image");
        }

        // Step 3: Extract data with Claude Vision
        updateQueueItem(item.id, { status: "extracting" });
        const { extractedData, frontImageHash, backImageHash } =
          await extractData(item.frontImage.blob, item.backImage?.blob || null);

        // Step 4: Save to database
        updateQueueItem(item.id, { status: "saving" });
        const saveResult = await saveConnectCard(
          slug,
          {
            imageKey: frontKey,
            imageHash: frontImageHash,
            backImageKey: backKey,
            backImageHash: backImageHash,
            extractedData,
          },
          locationId
        );

        if (saveResult.status !== "success") {
          throw new Error(saveResult.message || "Failed to save card");
        }

        // Update batch info on first success
        if (!activeBatch) {
          startTransition(async () => {
            const batchResult = await getActiveBatchAction(slug);
            if (batchResult.status === "success" && batchResult.data) {
              setActiveBatch(batchResult.data);
            }
          });
        }

        // Success!
        updateQueueItem(item.id, { status: "complete" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Processing failed";
        updateQueueItem(item.id, { status: "failed", error: message });
      }
    },
    [slug, locationId, activeBatch, startTransition, updateQueueItem]
  );

  // Background queue processor
  useEffect(() => {
    const processNext = async () => {
      // Don't start if already processing
      if (processingRef.current) return;

      // Find next pending item
      const pendingItem = queue.find(item => item.status === "pending");
      if (!pendingItem) return;

      // Lock and process
      processingRef.current = true;
      await processQueueItem(pendingItem);
      processingRef.current = false;
    };

    processNext();
  }, [queue, processQueueItem]);

  // Retry a failed card (used by retry button in queue list)
  const retryCard = useCallback(
    (id: string) => {
      updateQueueItem(id, { status: "pending", error: undefined });
    },
    [updateQueueItem]
  );

  // Remove a failed card from queue (used by remove button in queue list)
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Expose retry/remove for future UI use
  void retryCard;
  void removeFromQueue;

  // Upload image to S3
  const uploadImage = async (
    blob: Blob,
    side: "front" | "back"
  ): Promise<string | null> => {
    try {
      const fileName = `connect-card-${side}-${Date.now()}.jpg`;

      const presignedResponse = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          contentType: "image/jpeg",
          size: blob.size,
          isImage: true,
          fileType: "connect-card", // Use connect-card type for proper S3 organization
          organizationSlug: slug,
          cardSide: side, // front or back for two-sided cards
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { presignedUrl, key } = await presignedResponse.json();

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to S3");
      }

      return key;
    } catch {
      return null;
    }
  };

  // Extract data using Claude Vision API
  const extractData = async (
    frontBlob: Blob,
    backBlob: Blob | null
  ): Promise<{
    extractedData: ExtractedData;
    frontImageHash: string;
    backImageHash: string | null;
  }> => {
    // Convert blobs to base64
    const frontBase64 = await blobToBase64(frontBlob);
    const backBase64 = backBlob ? await blobToBase64(backBlob) : null;

    const requestBody: Record<string, unknown> = {
      organizationSlug: slug,
    };

    if (backBase64) {
      // Two-sided format
      requestBody.frontImageData = frontBase64;
      requestBody.frontMediaType = "image/jpeg";
      requestBody.backImageData = backBase64;
      requestBody.backMediaType = "image/jpeg";
    } else {
      // Single-sided format (backward compatible)
      requestBody.imageData = frontBase64;
      requestBody.mediaType = "image/jpeg";
    }

    const response = await fetch("/api/connect-cards/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (response.status === 409 && result.duplicate) {
      throw new Error(result.message || "Duplicate image detected");
    }

    if (!response.ok) {
      throw new Error(result.error || "Extraction failed");
    }

    return {
      extractedData: result.data,
      frontImageHash: result.imageHash,
      backImageHash: result.backImageHash || null,
    };
  };

  // Helper: Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Computed queue stats
  const queueStats = {
    pending: queue.filter(q => q.status === "pending").length,
    processing: queue.filter(q =>
      ["uploading", "extracting", "saving"].includes(q.status)
    ).length,
    complete: queue.filter(q => q.status === "complete").length,
    failed: queue.filter(q => q.status === "failed").length,
    total: queue.length,
  };

  // For future use: show failed cards with retry option
  const _failedCards = queue.filter(q => q.status === "failed");
  void _failedCards;

  // Finish batch and go to review
  const handleFinishBatch = () => {
    clearSession();
    if (activeBatch) {
      router.push(
        `/church/${slug}/admin/connect-cards/review/${activeBatch.id}`
      );
    } else {
      router.push(`/church/${slug}/admin/connect-cards`);
    }
  };

  // Render based on current step
  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)]">
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
                onClick={() => setStep("capture-front")}
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>

              {/* Resume indicator */}
              {cardsScanned > 0 && activeBatch && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Resuming session: {cardsScanned} cards in &quot;
                    {activeBatch.name}&quot;
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
                {/* Header row with back button, card indicator, and review button */}
                <div className="flex items-center justify-between px-4 mb-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/church/${slug}/admin/connect-cards`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Link>
                  </Button>

                  {/* Center: Current card indicator */}
                  <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium">
                    {queue.length > 0
                      ? `Card #${queue.length + 1}`
                      : step === "capture-front"
                        ? cardType === "double"
                          ? "Front of Card"
                          : "Capture Card"
                        : "Back of Card"}
                  </div>

                  {/* Right: Review Batch button */}
                  {queue.length > 0 ? (
                    <Button
                      size="sm"
                      onClick={handleFinishBatch}
                      disabled={
                        queueStats.processing > 0 || queueStats.pending > 0
                      }
                    >
                      Review Batch
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

        {/* QUEUE LIST - Shows all cards with status */}
        {queue.length > 0 &&
          (step === "capture-front" || step === "capture-back") && (
            <div className="bg-muted/50 border-t px-4 py-3 max-h-48 overflow-y-auto">
              <div className="max-w-md mx-auto space-y-1">
                {/* Card list - simple one line per card */}
                {queue.map((card, index) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>Card #{index + 1}</span>
                    <span
                      className={
                        card.status === "complete"
                          ? "text-green-600"
                          : card.status === "failed"
                            ? "text-destructive"
                            : card.status === "pending"
                              ? "text-muted-foreground"
                              : "text-primary"
                      }
                    >
                      {card.status === "complete" && "Uploaded"}
                      {card.status === "failed" && "Failed"}
                      {card.status === "pending" && "Queued"}
                      {card.status === "uploading" && "Uploading..."}
                      {card.status === "extracting" && "Analyzing..."}
                      {card.status === "saving" && "Saving..."}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
