"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type CameraFacing = "user" | "environment";

export interface CameraState {
  isSupported: boolean;
  isReady: boolean;
  isActive: boolean;
  error: string | null;
  facing: CameraFacing;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: CameraState;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: (
    cropToGuide?: boolean
  ) => Promise<{ blob: Blob; dataUrl: string } | null>;
  switchCamera: () => Promise<void>;
}

/**
 * useCamera Hook
 *
 * Provides camera access via getUserMedia for live viewfinder.
 * Designed for mobile-first connect card scanning with:
 * - Rear camera preference (environment facing)
 * - Image capture to blob/dataUrl
 * - Camera switching support
 *
 * @returns Camera controls and state
 */
export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize with false to avoid hydration mismatch - update in useEffect
  const [state, setState] = useState<CameraState>({
    isSupported: false,
    isReady: false,
    isActive: false,
    error: null,
    facing: "environment", // Default to rear camera for scanning cards
  });

  // Check camera support on client only (after hydration)
  useEffect(() => {
    const isSupported =
      typeof navigator !== "undefined" &&
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices;

    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: "Camera not supported on this device",
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      // Check permission state first (if API available)
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          console.log("[Camera] Permission state:", permissionStatus.state);
        } catch {
          // Permissions API may not support camera query in all browsers
        }
      }

      // Request camera with constraints for card scanning
      // Use flexible constraints - ideal is a hint, not requirement
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: state.facing },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setState(prev => ({
          ...prev,
          isActive: true,
          isReady: true,
          error: null,
        }));
      }
    } catch (err) {
      let errorMessage = "Failed to access camera";

      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            errorMessage =
              "Camera permission denied. Please allow camera access.";
            break;
          case "NotFoundError":
            errorMessage = "No camera found on this device";
            break;
          case "NotReadableError":
            errorMessage = "Camera is already in use by another app";
            break;
          case "OverconstrainedError":
            errorMessage = "Camera cannot meet the requested settings";
            break;
          default:
            errorMessage = `Camera error: ${err.message}`;
        }
      }

      setState(prev => ({
        ...prev,
        isActive: false,
        isReady: false,
        error: errorMessage,
      }));
    }
  }, [state.isSupported, state.facing]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      isReady: false,
    }));
  }, []);

  /**
   * Capture image from video stream
   * @param cropToGuide - If true, crop to the card alignment guide (85% width, 3:2 aspect)
   */
  const captureImage = useCallback(
    async (
      cropToGuide: boolean = false
    ): Promise<{
      blob: Blob;
      dataUrl: string;
    } | null> => {
      if (!videoRef.current || !canvasRef.current || !state.isActive) {
        return null;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return null;

      if (cropToGuide) {
        // Calculate crop region matching the card alignment guide
        // Guide is 85% width with 3:2 aspect ratio, centered
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // The video displays as object-cover, so we need to calculate
        // the visible region based on the container aspect ratio
        const containerAspect = video.clientWidth / video.clientHeight;
        const videoAspect = videoWidth / videoHeight;

        let visibleWidth = videoWidth;
        let visibleHeight = videoHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (videoAspect > containerAspect) {
          // Video is wider - cropped on sides
          visibleWidth = videoHeight * containerAspect;
          offsetX = (videoWidth - visibleWidth) / 2;
        } else {
          // Video is taller - cropped on top/bottom
          visibleHeight = videoWidth / containerAspect;
          offsetY = (videoHeight - visibleHeight) / 2;
        }

        // Now calculate the guide region (85% width, 3:2 aspect, centered)
        const guideWidthRatio = 0.85;
        const guideAspect = 3 / 2;

        const guideWidth = visibleWidth * guideWidthRatio;
        const guideHeight = guideWidth / guideAspect;

        const cropX = offsetX + (visibleWidth - guideWidth) / 2;
        const cropY = offsetY + (visibleHeight - guideHeight) / 2;

        // Set canvas to cropped dimensions
        canvas.width = guideWidth;
        canvas.height = guideHeight;

        // Draw cropped region
        context.drawImage(
          video,
          cropX,
          cropY,
          guideWidth,
          guideHeight, // Source region
          0,
          0,
          guideWidth,
          guideHeight // Destination
        );
      } else {
        // Full frame capture
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Get data URL for preview
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      // Get blob for upload
      return new Promise(resolve => {
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              resolve(null);
            }
          },
          "image/jpeg",
          0.92
        );
      });
    },
    [state.isActive]
  );

  const switchCamera = useCallback(async () => {
    // Stop current stream
    stopCamera();

    // Toggle facing mode
    setState(prev => ({
      ...prev,
      facing: prev.facing === "environment" ? "user" : "environment",
    }));

    // Wait for state update then restart
    // Note: startCamera will use the new facing value from next render
  }, [stopCamera]);

  // Auto-restart camera after facing change
  useEffect(() => {
    if (!state.isActive && state.isSupported && !state.error) {
      // Only auto-start if we were previously active (camera switch scenario)
      // Don't auto-start on initial mount
    }
  }, [state.facing, state.isActive, state.isSupported, state.error]);

  return {
    videoRef,
    canvasRef,
    state,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
  };
}
