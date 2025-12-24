"use client";

/**
 * QR/Mobile Scan Wizard - Async Processing Implementation
 *
 * Flow:
 * 1. Setup - Select card type (1-sided/2-sided) and location
 * 2. Capture Front - Take photo of front
 * 3. Preview Front - Review, retake or accept
 * 4. Capture Back (if 2-sided) - Take photo of back
 * 5. Preview Back - Review, retake or accept
 * 6. Card complete - Add to async queue (processes in background)
 * 7. Continue scanning while earlier cards process
 * 8. Done - Go to finish screen when ready
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  FlipHorizontal,
  X,
  Maximize,
  Minimize,
  Check,
  RotateCcw,
  Square,
  Layers,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAsyncCardProcessor,
  CapturedImage,
} from "@/hooks/use-async-card-processor";
import {
  ProcessingStatsDisplay,
  QueueDrawer,
  SessionRecoveryDialog,
} from "@/components/dashboard/connect-cards/scan";

interface ScanWizardClientProps {
  slug: string;
  locations: { id: string; name: string; slug: string }[];
  defaultLocationId: string | null;
  scanToken?: string;
  defaultCardType?: "single" | "double";
}

type WizardStep =
  | "setup"
  | "capture-front"
  | "preview-front"
  | "capture-back"
  | "preview-back"
  | "finished";

type CardType = "single" | "double";

export function ScanWizardClient({
  slug,
  locations,
  defaultLocationId,
  scanToken,
  defaultCardType = "single",
}: ScanWizardClientProps) {
  // Session state
  const [sessionReady, setSessionReady] = useState(!scanToken);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Create scan session cookie when component mounts (for token-based auth)
  useEffect(() => {
    if (!scanToken) return;

    const createSession = async () => {
      try {
        const response = await fetch("/api/scan/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: scanToken, slug }),
        });

        if (!response.ok) {
          const data = await response.json();
          setSessionError(data.error || "Failed to create session");
          return;
        }

        setSessionReady(true);
      } catch {
        setSessionError("Network error. Please try again.");
      }
    };

    createSession();
  }, [scanToken, slug]);

  // Wizard state
  const [step, setStep] = useState<WizardStep>("setup");
  const [cardType, setCardType] = useState<CardType>(defaultCardType);
  const [locationId, setLocationId] = useState<string>(
    defaultLocationId || locations[0]?.id || ""
  );

  // Current card being captured (store both dataUrl for preview and blob for upload)
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

  // Camera state
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Detect orientation and iOS
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    const checkIOS = () => {
      const ua = navigator.userAgent;
      setIsIOS(
        /iPad|iPhone|iPod/.test(ua) &&
          !(window as unknown as { MSStream?: unknown }).MSStream
      );
    };

    checkOrientation();
    checkIOS();

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Camera failed");
      }
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);

    if (isStreaming) {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newFacingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Camera switch failed");
        }
      }
    }
  }, [facingMode, isStreaming]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Debug: Quick fingerprint of dataUrl for tracing
  const getFingerprint = (dataUrl: string) => {
    // Use a slice from the middle of the data (after header, into actual image data)
    const start = dataUrl.indexOf(",") + 1000; // Skip base64 header + some data
    return dataUrl.slice(start, start + 32);
  };

  // Capture current frame - crops to visible area (WYSIWYG)
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    console.log("[DEBUG CAPTURE] Starting capture...");
    console.log(
      "[DEBUG CAPTURE] Video dimensions:",
      video.videoWidth,
      "x",
      video.videoHeight
    );

    // Get the display dimensions (what user sees)
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    // Get the actual video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate aspect ratios
    const displayAspect = displayWidth / displayHeight;
    const videoAspect = videoWidth / videoHeight;

    // Calculate the visible portion of the video (object-cover behavior)
    let sx = 0,
      sy = 0,
      sWidth = videoWidth,
      sHeight = videoHeight;

    if (videoAspect > displayAspect) {
      sWidth = videoHeight * displayAspect;
      sx = (videoWidth - sWidth) / 2;
    } else {
      sHeight = videoWidth / displayAspect;
      sy = (videoHeight - sHeight) / 2;
    }

    canvas.width = sWidth;
    canvas.height = sHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

    // Get both dataUrl and blob
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    // DEBUG: Log fingerprint of the captured image
    const fingerprint = getFingerprint(dataUrl);
    console.log("[DEBUG CAPTURE] DataUrl length:", dataUrl.length);
    console.log("[DEBUG CAPTURE] Fingerprint (middle 32 chars):", fingerprint);
    console.log("[DEBUG CAPTURE] Step:", step);

    canvas.toBlob(
      blob => {
        if (!blob) {
          toast.error("Failed to capture image");
          return;
        }

        console.log("[DEBUG CAPTURE] Blob size:", blob.size, "bytes");

        const capturedImage: CapturedImage = {
          blob,
          dataUrl,
        };

        if (step === "capture-front") {
          console.log("[DEBUG CAPTURE] Setting as FRONT image");
          setFrontImage(capturedImage);
          setStep("preview-front");
        } else if (step === "capture-back") {
          console.log("[DEBUG CAPTURE] Setting as BACK image");
          setBackImage(capturedImage);
          setStep("preview-back");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [step]);

  // Start scanning (from setup)
  const startScanning = useCallback(() => {
    setStep("capture-front");
    startCamera();
  }, [startCamera]);

  // Accept front image
  const acceptFront = useCallback(() => {
    if (cardType === "double") {
      console.log("[DEBUG ACCEPT] Front accepted, moving to capture-back");
      setStep("capture-back");
    } else {
      // Single-sided card complete - add to async queue
      console.log("[DEBUG ACCEPT] Single-sided card - adding to processor");
      console.log("[DEBUG ACCEPT] Front blob size:", frontImage?.blob.size);
      console.log(
        "[DEBUG ACCEPT] Front fingerprint:",
        frontImage?.dataUrl ? getFingerprint(frontImage.dataUrl) : "N/A"
      );
      processor.addCard(frontImage!, null);
      setFrontImage(null);
      setStep("capture-front");
      toast.success("Card queued - keep scanning!");
    }
  }, [cardType, frontImage, processor]);

  // Accept back image (card complete)
  const acceptBack = useCallback(() => {
    console.log(
      "[DEBUG ACCEPT] Double-sided card complete - adding to processor"
    );
    console.log("[DEBUG ACCEPT] Front blob size:", frontImage?.blob.size);
    console.log(
      "[DEBUG ACCEPT] Front fingerprint:",
      frontImage?.dataUrl ? getFingerprint(frontImage.dataUrl) : "N/A"
    );
    console.log("[DEBUG ACCEPT] Back blob size:", backImage?.blob.size);
    console.log(
      "[DEBUG ACCEPT] Back fingerprint:",
      backImage?.dataUrl ? getFingerprint(backImage.dataUrl) : "N/A"
    );
    processor.addCard(frontImage!, backImage);
    setFrontImage(null);
    setBackImage(null);
    setStep("capture-front");
    toast.success("Card queued - keep scanning!");
  }, [frontImage, backImage, processor]);

  // Retake current image
  const retake = useCallback(() => {
    if (step === "preview-front") {
      setFrontImage(null);
      setStep("capture-front");
    } else if (step === "preview-back") {
      setBackImage(null);
      setStep("capture-back");
    }
  }, [step]);

  // Finish scanning - stop camera and show completion
  const finishScanning = useCallback(() => {
    stopCamera();
    setStep("finished");
  }, [stopCamera]);

  // Reset wizard to start over
  const resetWizard = useCallback(() => {
    processor.reset();
    setFrontImage(null);
    setBackImage(null);
    setStep("setup");
  }, [processor]);

  // Handle session recovery
  const handleResumeSession = useCallback(() => {
    processor.resumeSession();
    setStep("capture-front");
    startCamera();
  }, [processor, startCamera]);

  const handleDiscardSession = useCallback(() => {
    processor.discardSession();
  }, [processor]);

  // Get current preview image
  const currentPreviewImage =
    step === "preview-front" ? frontImage?.dataUrl : backImage?.dataUrl;
  const isCapturing = step === "capture-front" || step === "capture-back";
  const isPreviewing = step === "preview-front" || step === "preview-back";

  // Can finish when all processing is done
  const canFinish =
    processor.stats.total > 0 &&
    !processor.isProcessing &&
    processor.stats.queued === 0;
  const allComplete =
    processor.stats.total > 0 &&
    processor.stats.complete === processor.stats.total;

  // ========== RENDER ==========

  // Show loading while session is being created
  if (!sessionReady) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6">
        <Loader2 className="h-12 w-12 text-white mb-4 animate-spin" />
        <h1 className="text-xl font-semibold text-white mb-2">Setting up...</h1>
        <p className="text-white/70 text-center">
          Preparing your scanning session
        </p>
      </div>
    );
  }

  // Show error if session creation failed
  if (sessionError) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Session Error</h1>
        <p className="text-white/70 text-center mb-4">{sessionError}</p>
        <p className="text-white/50 text-sm text-center">
          Please scan the QR code again to get a new link.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

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

      {/* SETUP STEP */}
      {step === "setup" && (
        <div className="flex-1 flex flex-col items-center pt-8 p-4">
          <Camera className="h-10 w-10 text-white mb-2" />
          <h1 className="text-lg font-semibold text-white mb-4">
            Ready to Scan
          </h1>

          <div className="w-full max-w-sm space-y-4">
            {/* Card Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Card Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={cardType === "single" ? "default" : "outline"}
                  className="h-14 flex-col gap-1"
                  onClick={() => setCardType("single")}
                >
                  <Square className="h-5 w-5" />
                  <span className="text-xs">1-Sided</span>
                </Button>
                <Button
                  variant={cardType === "double" ? "default" : "outline"}
                  className="h-14 flex-col gap-1"
                  onClick={() => setCardType("double")}
                >
                  <Layers className="h-5 w-5" />
                  <span className="text-xs">2-Sided</span>
                </Button>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
            <Button size="lg" className="w-full" onClick={startScanning}>
              <Camera className="mr-2 h-5 w-5" />
              Start Scanning
            </Button>

            {/* Show batch info if resuming */}
            {processor.batchInfo && (
              <p className="text-white/50 text-center text-sm">
                Resuming: {processor.stats.complete} cards complete
              </p>
            )}
          </div>
        </div>
      )}

      {/* CAMERA / PREVIEW VIEW */}
      {(isCapturing || isPreviewing) && (
        <div className={`flex-1 flex ${isLandscape ? "flex-row" : "flex-col"}`}>
          {/* Header - shows card progress, stats, and which side */}
          <div
            className={`bg-black/80 p-3 flex items-center justify-between ${
              isLandscape ? "hidden" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Card count */}
              <span className="text-white text-sm font-medium">
                Card {processor.stats.total + 1}
              </span>

              <span className="text-white/30">|</span>

              {/* Which side */}
              <span className="text-white font-medium">
                {step.includes("front") ? "Front" : "Back"}
              </span>
              {cardType === "double" && (
                <span className="text-white/60 text-sm">
                  ({step.includes("front") ? "1" : "2"}/2)
                </span>
              )}
            </div>

            {/* Compact stats - tappable to open drawer */}
            <ProcessingStatsDisplay
              stats={processor.stats}
              isProcessing={processor.isProcessing}
              onClick={() => setIsDrawerOpen(true)}
            />
          </div>

          {/* Main view - takes most space */}
          <div className="flex-1 relative">
            {/* Video (when capturing) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                isCapturing && isStreaming ? "block" : "hidden"
              }`}
            />

            {/* Preview image */}
            {isPreviewing && currentPreviewImage && (
              <img
                src={currentPreviewImage}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            )}

            {/* Error */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-sm text-center">
                  <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-white mb-4">{error}</p>
                  <Button onClick={startCamera} variant="secondary">
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Landscape header overlay */}
            {isLandscape && (isCapturing || isPreviewing) && (
              <div className="absolute top-0 left-0 right-0 bg-black/60 p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm font-medium">
                    Card {processor.stats.total + 1}
                  </span>

                  <span className="text-white/30">|</span>

                  <span className="text-white text-sm font-medium">
                    {step.includes("front") ? "Front" : "Back"}
                  </span>
                  {cardType === "double" && (
                    <span className="text-white/60 text-sm">
                      ({step.includes("front") ? "1" : "2"}/2)
                    </span>
                  )}
                </div>

                <ProcessingStatsDisplay
                  stats={processor.stats}
                  isProcessing={processor.isProcessing}
                  onClick={() => setIsDrawerOpen(true)}
                />
              </div>
            )}
          </div>

          {/* Controls - Capture mode */}
          {isCapturing && isStreaming && (
            <div
              className={`bg-black p-4 flex items-center justify-center gap-4 ${
                isLandscape ? "flex-col w-20" : "flex-row"
              }`}
            >
              {/* Fullscreen - hide on iOS */}
              {!isIOS && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/20"
                onClick={switchCamera}
              >
                <FlipHorizontal className="h-5 w-5" />
              </Button>

              <button
                className="h-16 w-16 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
                onClick={captureFrame}
              >
                <div className="h-14 w-14 rounded-full border-4 border-black" />
              </button>

              {/* Done button - visible when cards are captured */}
              {processor.stats.total > 0 ? (
                <Button
                  size="sm"
                  className={`gap-1 ${isLandscape ? "w-full" : ""} ${
                    allComplete ? "animate-pulse" : ""
                  }`}
                  onClick={finishScanning}
                  disabled={!canFinish}
                  variant={allComplete ? "default" : "secondary"}
                >
                  <Check className="h-4 w-4" />
                  <span className={isLandscape ? "hidden" : ""}>Done</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20"
                  onClick={() => {
                    stopCamera();
                    setStep("setup");
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {/* Controls - Preview mode */}
          {isPreviewing && (
            <div
              className={`bg-black p-4 flex items-center justify-center gap-4 ${
                isLandscape ? "flex-col w-24" : "flex-row gap-8"
              }`}
            >
              <Button
                variant="ghost"
                size={isLandscape ? "default" : "lg"}
                className={`text-white hover:bg-white/20 gap-2 ${
                  isLandscape ? "w-full" : ""
                }`}
                onClick={retake}
              >
                <RotateCcw className="h-5 w-5" />
                {!isLandscape && "Retake"}
              </Button>

              <Button
                size={isLandscape ? "default" : "lg"}
                className={`gap-2 ${isLandscape ? "w-full" : ""}`}
                onClick={step === "preview-front" ? acceptFront : acceptBack}
              >
                <Check className="h-5 w-5" />
                {isLandscape
                  ? cardType === "double" && step === "preview-front"
                    ? "Next"
                    : "Use"
                  : cardType === "double" && step === "preview-front"
                    ? "Next: Back"
                    : "Use Photo"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* FINISHED STEP - Session complete guidance */}
      {step === "finished" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">All Done!</h1>

          {/* Summary */}
          <div className="w-full max-w-sm space-y-4 mt-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex justify-between text-white mb-2">
                <span>Total Cards</span>
                <span>{processor.stats.total}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Successful</span>
                <span>{processor.stats.complete}</span>
              </div>
              {processor.stats.failed > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Failed</span>
                  <span>{processor.stats.failed}</span>
                </div>
              )}
            </div>

            {/* Direct instruction */}
            <div className="bg-white/10 rounded-lg p-5 text-center">
              <p className="text-white text-sm leading-relaxed">
                Close this page and go to the{" "}
                <span className="font-semibold text-primary">Review Queue</span>{" "}
                on your computer to review and approve your cards.
              </p>
            </div>

            {/* Option to scan more */}
            <Button
              variant="ghost"
              className="w-full text-white/60 hover:text-white hover:bg-white/10"
              onClick={resetWizard}
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan More Cards
            </Button>

            {/* View failed cards */}
            {processor.stats.failed > 0 && (
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => setIsDrawerOpen(true)}
              >
                View Failed Cards ({processor.stats.failed})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
