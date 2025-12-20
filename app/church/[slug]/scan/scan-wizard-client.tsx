"use client";

/**
 * Scan Wizard v2 - Clean Implementation
 *
 * Flow:
 * 1. Setup - Select card type (1-sided/2-sided) and location
 * 2. Capture Front - Take photo of front
 * 3. Preview Front - Review, retake or accept
 * 4. Capture Back (if 2-sided) - Take photo of back
 * 5. Preview Back - Review, retake or accept
 * 6. Card complete - Add to queue, continue to next card
 * 7. Done - Upload all cards and process via Claude Vision
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useConnectCardUpload } from "@/hooks/use-connect-card-upload";

interface ScanWizardClientProps {
  slug: string;
  locations: { id: string; name: string; slug: string }[];
  defaultLocationId: string | null;
  scanToken?: string;
}

type WizardStep =
  | "setup"
  | "capture-front"
  | "preview-front"
  | "capture-back"
  | "preview-back"
  | "submitting"
  | "complete";

type CardType = "single" | "double";

interface CapturedCard {
  id: string;
  frontImage: string;
  backImage: string | null;
}

export function ScanWizardClient({
  slug,
  locations,
  defaultLocationId,
}: ScanWizardClientProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>("setup");
  const [cardType, setCardType] = useState<CardType>("single");
  const [locationId, setLocationId] = useState<string>(
    defaultLocationId || locations[0]?.id || ""
  );

  // Current card being captured
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  // Queue of completed cards
  const [capturedCards, setCapturedCards] = useState<CapturedCard[]>([]);

  // Upload hook
  const {
    uploadStates,
    processCards,
    reset: resetUpload,
  } = useConnectCardUpload({
    slug,
    locationId,
  });

  // Camera state
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      console.log("Fullscreen not supported");
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

  // Switch camera - stops current stream, updates facing mode, restarts
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);

    // Restart camera with new facing mode if currently streaming
    if (isStreaming) {
      try {
        // Stop current stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Get new stream with new facing mode
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

  // Capture current frame
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    if (step === "capture-front") {
      setFrontImage(imageData);
      setStep("preview-front");
    } else if (step === "capture-back") {
      setBackImage(imageData);
      setStep("preview-back");
    }
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
      // Single-sided card complete - add to queue
      const newCard: CapturedCard = {
        id: crypto.randomUUID(),
        frontImage: frontImage!,
        backImage: null,
      };
      setCapturedCards(prev => [...prev, newCard]);
      setFrontImage(null);
      setStep("capture-front"); // Continue scanning
    }
  }, [cardType, frontImage]);

  // Accept back image (card complete)
  const acceptBack = useCallback(() => {
    const newCard: CapturedCard = {
      id: crypto.randomUUID(),
      frontImage: frontImage!,
      backImage: backImage,
    };
    setCapturedCards(prev => [...prev, newCard]);
    setFrontImage(null);
    setBackImage(null);
    setStep("capture-front"); // Continue scanning
  }, [frontImage, backImage]);

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

  // Submit all captured cards
  const submitCards = useCallback(async () => {
    if (capturedCards.length === 0) return;

    stopCamera();
    setStep("submitting");

    const cardsToProcess = capturedCards.map(card => ({
      id: card.id,
      frontImage: card.frontImage,
      backImage: card.backImage,
    }));

    const { successCount, errorCount } = await processCards(cardsToProcess);

    setStep("complete");

    if (successCount > 0) {
      toast.success(
        `${successCount} card${successCount !== 1 ? "s" : ""} uploaded successfully!`
      );
    }
    if (errorCount > 0) {
      toast.error(
        `${errorCount} card${errorCount !== 1 ? "s" : ""} failed to upload`
      );
    }
  }, [capturedCards, stopCamera, processCards]);

  // Reset wizard to start over
  const resetWizard = useCallback(() => {
    setCapturedCards([]);
    setFrontImage(null);
    setBackImage(null);
    resetUpload();
    setStep("setup");
  }, [resetUpload]);

  // Get current preview image
  const currentPreviewImage = step === "preview-front" ? frontImage : backImage;
  const isCapturing = step === "capture-front" || step === "capture-back";
  const isPreviewing = step === "preview-front" || step === "preview-back";

  // ========== RENDER ==========

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* SETUP STEP */}
      {step === "setup" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Camera className="h-12 w-12 text-white mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Ready to Scan
          </h1>
          <p className="text-white/70 text-center mb-8">
            Configure your scanning session
          </p>

          <div className="w-full max-w-sm space-y-6">
            {/* Card Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">
                Card Type
              </label>
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

            {/* Location */}
            <div className="space-y-3">
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

            {/* Show count if we have captured cards */}
            {capturedCards.length > 0 && (
              <p className="text-white/50 text-center">
                {capturedCards.length} card
                {capturedCards.length !== 1 ? "s" : ""} captured
              </p>
            )}
          </div>
        </div>
      )}

      {/* CAMERA / PREVIEW VIEW */}
      {(isCapturing || isPreviewing) && (
        <>
          {/* Header - shows which side we're capturing */}
          <div className="bg-black/80 p-3 text-center">
            <span className="text-white font-medium">
              {step === "capture-front" && "Front of Card"}
              {step === "preview-front" && "Front of Card"}
              {step === "capture-back" && "Back of Card"}
              {step === "preview-back" && "Back of Card"}
            </span>
            {cardType === "double" && (
              <span className="text-white/60 ml-2">
                ({step.includes("front") ? "1" : "2"} of 2)
              </span>
            )}
          </div>

          {/* Main view */}
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
          </div>

          {/* Controls - Capture mode */}
          {isCapturing && isStreaming && (
            <div className="bg-black p-4 flex items-center justify-center gap-4">
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
              {capturedCards.length > 0 ? (
                <Button size="sm" className="gap-1" onClick={submitCards}>
                  <Upload className="h-4 w-4" />
                  Done ({capturedCards.length})
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
            <div className="bg-black p-4 flex items-center justify-center gap-8">
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 gap-2"
                onClick={retake}
              >
                <RotateCcw className="h-5 w-5" />
                Retake
              </Button>

              <Button
                size="lg"
                className="gap-2"
                onClick={step === "preview-front" ? acceptFront : acceptBack}
              >
                <Check className="h-5 w-5" />
                {cardType === "double" && step === "preview-front"
                  ? "Next: Back"
                  : "Use Photo"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* SUBMITTING STEP */}
      {step === "submitting" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="h-12 w-12 text-white mb-4 animate-spin" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Uploading Cards
          </h1>
          <p className="text-white/70 text-center mb-8">
            Processing {capturedCards.length} card
            {capturedCards.length !== 1 ? "s" : ""}...
          </p>

          <div className="w-full max-w-sm space-y-4">
            {capturedCards.map(card => {
              const state = uploadStates.get(card.id);
              const status = state?.status || "pending";
              const progress = state?.progress || 0;

              return (
                <div key={card.id} className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    {status === "done" && (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    )}
                    {status === "error" && (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    {status !== "done" && status !== "error" && (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    )}
                    <span className="text-white text-sm flex-1">
                      Card {capturedCards.indexOf(card) + 1}
                    </span>
                    <span className="text-white/60 text-xs capitalize">
                      {status}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPLETE STEP */}
      {step === "complete" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <CheckCircle2 className="h-16 w-16 text-green-400 mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Upload Complete!
          </h1>
          <p className="text-white/70 text-center mb-8">
            Your cards have been uploaded and are being processed.
          </p>

          <div className="w-full max-w-sm space-y-4">
            {/* Summary */}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex justify-between text-white mb-2">
                <span>Total Cards</span>
                <span>{capturedCards.length}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Successful</span>
                <span>
                  {
                    Array.from(uploadStates.values()).filter(
                      s => s.status === "done"
                    ).length
                  }
                </span>
              </div>
              {Array.from(uploadStates.values()).some(
                s => s.status === "error"
              ) && (
                <div className="flex justify-between text-red-400">
                  <span>Failed</span>
                  <span>
                    {
                      Array.from(uploadStates.values()).filter(
                        s => s.status === "error"
                      ).length
                    }
                  </span>
                </div>
              )}
            </div>

            <Button size="lg" className="w-full gap-2" onClick={resetWizard}>
              <Camera className="h-5 w-5" />
              Scan More Cards
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
