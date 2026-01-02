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

  // Capture current frame - crops to visible area (WYSIWYG)
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

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

    canvas.toBlob(
      blob => {
        if (!blob) {
          toast.error("Failed to capture image");
          return;
        }

        const capturedImage: CapturedImage = {
          blob,
          dataUrl,
        };

        if (step === "capture-front") {
          setFrontImage(capturedImage);
          setStep("preview-front");
        } else if (step === "capture-back") {
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
      setStep("capture-back");
    } else {
      // Single-sided card complete - add to async queue
      processor.addCard(frontImage!, null);
      setFrontImage(null);
      setStep("capture-front");
      toast.success("Card queued - keep scanning!");
    }
  }, [cardType, frontImage, processor]);

  // Accept back image (card complete)
  const acceptBack = useCallback(() => {
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
  // All cards processed (complete, duplicate, or failed - none pending)
  const allComplete =
    processor.stats.total > 0 &&
    processor.stats.complete +
      processor.stats.duplicate +
      processor.stats.failed ===
      processor.stats.total;

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
              className={`bg-black p-4 flex items-center justify-center gap-3 ${
                isLandscape ? "flex-col w-28" : "flex-row"
              }`}
            >
              {/* Fullscreen - hide on iOS */}
              {!isIOS && (
                <Button
                  variant="ghost"
                  size={isLandscape ? "sm" : "icon"}
                  className={`text-white bg-white/10 hover:bg-white/20 ${
                    isLandscape ? "w-full justify-start gap-2" : "h-10 w-10"
                  }`}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                  {isLandscape && (
                    <span className="text-xs">
                      {isFullscreen ? "Exit" : "Fullscreen"}
                    </span>
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size={isLandscape ? "sm" : "icon"}
                className={`text-white bg-white/10 hover:bg-white/20 ${
                  isLandscape ? "w-full justify-start gap-2" : "h-10 w-10"
                }`}
                onClick={switchCamera}
              >
                <FlipHorizontal className="h-4 w-4" />
                {isLandscape && <span className="text-xs">Flip</span>}
              </Button>

              <button
                className="h-16 w-16 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform shrink-0"
                onClick={captureFrame}
              >
                <div className="h-14 w-14 rounded-full border-4 border-black" />
              </button>

              {/* Done button - visible when cards are captured */}
              {processor.stats.total > 0 ? (
                <Button
                  size="sm"
                  className={`gap-2 ${isLandscape ? "w-full" : ""} ${
                    allComplete ? "animate-pulse" : ""
                  }`}
                  onClick={finishScanning}
                  disabled={!canFinish}
                  variant={allComplete ? "default" : "secondary"}
                >
                  <Check className="h-4 w-4" />
                  <span>{isLandscape ? "Finish" : "Done"}</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size={isLandscape ? "sm" : "icon"}
                  className={`text-white bg-white/10 hover:bg-white/20 ${
                    isLandscape ? "w-full justify-start gap-2" : "h-10 w-10"
                  }`}
                  onClick={() => {
                    stopCamera();
                    setStep("setup");
                  }}
                >
                  <X className="h-4 w-4" />
                  {isLandscape && <span className="text-xs">Cancel</span>}
                </Button>
              )}
            </div>
          )}

          {/* Controls - Preview mode */}
          {isPreviewing && (
            <div
              className={`bg-black p-4 flex items-center justify-center gap-4 ${
                isLandscape ? "flex-col w-28" : "flex-row gap-8"
              }`}
            >
              <Button
                variant="ghost"
                size={isLandscape ? "sm" : "lg"}
                className={`text-white bg-white/10 hover:bg-white/20 gap-2 ${
                  isLandscape ? "w-full" : ""
                }`}
                onClick={retake}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retake</span>
              </Button>

              <Button
                size={isLandscape ? "sm" : "lg"}
                className={`gap-2 ${isLandscape ? "w-full" : ""}`}
                onClick={step === "preview-front" ? acceptFront : acceptBack}
              >
                <Check className="h-4 w-4" />
                <span>
                  {cardType === "double" && step === "preview-front"
                    ? isLandscape
                      ? "Next"
                      : "Next: Back"
                    : isLandscape
                      ? "Use"
                      : "Use Photo"}
                </span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* FINISHED STEP - Session complete guidance */}
      {step === "finished" && (
        <div className="flex-1 flex flex-col items-center p-4 pt-8 overflow-y-auto">
          {/* Compact header - icon and title inline */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <h1 className="text-xl font-semibold text-white">All Done!</h1>
          </div>

          {/* Summary */}
          <div className="w-full max-w-sm space-y-3">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex justify-between text-white mb-1">
                <span className="text-sm">Total Cards</span>
                <span className="text-sm">{processor.stats.total}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span className="text-sm">Successful</span>
                <span className="text-sm">{processor.stats.complete}</span>
              </div>
              {processor.stats.duplicate > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span className="text-sm">Duplicates (skipped)</span>
                  <span className="text-sm">{processor.stats.duplicate}</span>
                </div>
              )}
              {processor.stats.failed > 0 && (
                <div className="flex justify-between text-red-400">
                  <span className="text-sm">Failed</span>
                  <span className="text-sm">{processor.stats.failed}</span>
                </div>
              )}
            </div>

            {/* Direct instruction */}
            <div className="bg-white/10 rounded-lg p-4 text-center">
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
