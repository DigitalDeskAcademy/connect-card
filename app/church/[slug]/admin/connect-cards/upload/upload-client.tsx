"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";

// File System Access API types (simplified for compatibility)
interface FSDirectoryHandle {
  values(): AsyncIterableIterator<FSHandle>;
  name: string;
}

interface FSHandle {
  kind: "file" | "directory";
  name: string;
  getFile?: () => Promise<File>;
}
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  Copy,
  ClipboardCheck,
  Layers,
  Square,
  Smartphone,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Package,
  ScanLine,
  FolderOpen,
  FolderSync,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { useIsMobile } from "@/hooks/use-mobile";
import { saveConnectCard } from "@/actions/connect-card/save-connect-card";
import { getActiveBatchAction } from "@/actions/connect-card/batch-actions";
import { createScanTokenAction } from "@/actions/connect-card/scan-token-actions";

// ============================================================================
// TYPES
// ============================================================================

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

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  key?: string;
  imageHash?: string;
  uploading: boolean;
  uploaded: boolean;
  error: boolean;
  extracting: boolean;
  extracted: boolean;
  extractedData?: ExtractedData;
  saved: boolean;
  savedId?: string;
  isDuplicate?: boolean;
  duplicateType?: "image" | "person";
  duplicateMessage?: string;
}

interface UploadClientProps {
  defaultLocationId: string | null;
}

type CardSide = "single" | "double";

// ============================================================================
// HELPERS
// ============================================================================

function normalizeExtractedData(data: Record<string, unknown>): ExtractedData {
  return {
    name: typeof data.name === "string" ? data.name : null,
    email: typeof data.email === "string" ? data.email : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    prayer_request:
      typeof data.prayer_request === "string" ? data.prayer_request : null,
    visit_status:
      typeof data.visit_status === "string" ? data.visit_status : null,
    first_time_visitor:
      typeof data.first_time_visitor === "boolean"
        ? data.first_time_visitor
        : null,
    interests: Array.isArray(data.interests)
      ? data.interests.filter((i): i is string => typeof i === "string")
      : null,
    address: typeof data.address === "string" ? data.address : null,
    age_group: typeof data.age_group === "string" ? data.age_group : null,
    family_info: typeof data.family_info === "string" ? data.family_info : null,
    additional_notes:
      data.additional_notes === null || data.additional_notes === undefined
        ? null
        : typeof data.additional_notes === "string"
          ? data.additional_notes
          : JSON.stringify(data.additional_notes),
  };
}

function validateExtractedData(data: ExtractedData): string[] {
  const warnings: string[] = [];

  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 10) {
      warnings.push(
        `Phone number has only ${digits.length} digits (expected 10+)`
      );
    } else if (digits.length > 11) {
      warnings.push(
        `Phone number has ${digits.length} digits (expected 10-11)`
      );
    }
    if (/^(.)\1+$/.test(digits)) {
      warnings.push("Phone number appears to be all same digit");
    }
  }

  if (data.email && !data.email.includes("@")) {
    warnings.push("Email address missing @ symbol");
  }

  if (data.name && data.name.length < 2) {
    warnings.push("Name seems too short");
  }

  return warnings;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConnectCardUploadClient({
  defaultLocationId,
}: UploadClientProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const isMobile = useIsMobile();

  // ========================================================================
  // SETUP STATE (persisted to localStorage)
  // ========================================================================
  const [cardSide, setCardSide] = useState<CardSide>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("connectCard.cardSide");
      if (saved === "single" || saved === "double") return saved;
    }
    return "double"; // Default to double-sided
  });

  // Persist card type to localStorage
  useEffect(() => {
    localStorage.setItem("connectCard.cardSide", cardSide);
  }, [cardSide]);

  // ========================================================================
  // QR MODAL STATE
  // ========================================================================
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrExpiry, setQrExpiry] = useState<Date | null>(null);

  // ========================================================================
  // DOCUMENT SCANNER MODAL STATE
  // ========================================================================
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [watchedFolderName, setWatchedFolderName] = useState<string | null>(
    null
  );
  const [isWatching, setIsWatching] = useState(false);

  // ========================================================================
  // UPLOAD/PROCESSING STATE
  // ========================================================================
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, startProcessing] = useTransition();

  // Active batch state
  const [activeBatch, setActiveBatch] = useState<{
    id: string;
    name: string;
    cardCount: number;
  } | null>(null);

  // Help guide state
  const [showHelp, setShowHelp] = useState(false);

  // ========================================================================
  // FOLDER WATCHING HANDLERS (File System Access API)
  // ========================================================================
  const folderHandleRef = useRef<FSDirectoryHandle | null>(null);
  const seenFilesRef = useRef<Set<string>>(new Set());
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for new files in the connected folder
  const checkForNewFiles = useCallback(async () => {
    const handle = folderHandleRef.current;
    if (!handle) return;

    try {
      const newFiles: File[] = [];

      for await (const entry of handle.values()) {
        if (entry.kind === "file" && entry.getFile) {
          const file = await entry.getFile();
          // Check if it's an image
          if (file.type.startsWith("image/")) {
            // Create unique key from name + size + lastModified
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

            if (!seenFilesRef.current.has(fileKey)) {
              newFiles.push(file);
              seenFilesRef.current.add(fileKey);
            }
          }
        }
      }

      if (newFiles.length > 0) {
        // Add new files to upload queue
        const newImages: UploadedImage[] = newFiles.map(file => ({
          id: Math.random().toString(36).substring(7),
          file,
          preview: URL.createObjectURL(file),
          uploading: false,
          uploaded: false,
          error: false,
          extracting: false,
          extracted: false,
          saved: false,
        }));
        setImages(prev => [...prev, ...newImages]);
        toast.success(
          `${newFiles.length} new card${newFiles.length > 1 ? "s" : ""} detected`
        );
      }
    } catch {
      // Folder access may have been revoked
      setIsWatching(false);
      setWatchedFolderName(null);
      folderHandleRef.current = null;
    }
  }, []);

  // Start/stop polling based on isWatching state
  useEffect(() => {
    if (isWatching && folderHandleRef.current) {
      // Check immediately
      checkForNewFiles();

      // Then poll every 2 seconds
      watchIntervalRef.current = setInterval(checkForNewFiles, 2000);
    }

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
    };
  }, [isWatching, checkForNewFiles]);

  const handleConnectFolder = async () => {
    try {
      // Check if API is supported
      const showDirectoryPicker = (
        window as unknown as {
          showDirectoryPicker?: (options?: {
            mode?: string;
          }) => Promise<FSDirectoryHandle>;
        }
      ).showDirectoryPicker;

      if (!showDirectoryPicker) {
        toast.error(
          "Your browser doesn't support folder watching. Try Chrome or Edge."
        );
        return;
      }

      // Request folder access (read-only)
      const handle = await showDirectoryPicker({
        mode: "read",
      });

      folderHandleRef.current = handle;
      setWatchedFolderName(handle.name);
      setIsWatching(true);
      toast.success(`Connected to "${handle.name}" folder`);
    } catch (error) {
      // User cancelled the picker
      if ((error as Error).name !== "AbortError") {
        toast.error("Failed to connect folder");
      }
    }
  };

  const handleDisconnectFolder = () => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
    folderHandleRef.current = null;
    seenFilesRef.current = new Set();
    setWatchedFolderName(null);
    setIsWatching(false);
    toast.info("Folder disconnected");
  };

  // ========================================================================
  // QR CODE HANDLERS
  // ========================================================================
  const generateQrCode = async () => {
    setQrLoading(true);
    try {
      const result = await createScanTokenAction(slug);
      if (result.status === "success" && result.data) {
        setScanUrl(result.data.scanUrl);
        setQrExpiry(result.data.expiresAt);
      } else {
        toast.error("Failed to generate QR code");
      }
    } catch {
      toast.error("Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  const handleOpenQrModal = async () => {
    if (!scanUrl) {
      await generateQrCode();
    }
    setQrModalOpen(true);
  };

  const copyLinkToClipboard = () => {
    if (scanUrl) {
      navigator.clipboard.writeText(scanUrl);
      toast.success("Link copied! Paste it in a text or email.");
    }
  };

  // ========================================================================
  // FILE UPLOAD HANDLERS
  // ========================================================================
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFilePicker,
  } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    disabled: isProcessing,
    noClick: false,
    onDrop: (acceptedFiles: File[]) => {
      const newImages: UploadedImage[] = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
        error: false,
        extracting: false,
        extracted: false,
        saved: false,
      }));
      setImages(prev => [...prev, ...newImages]);
      // Close scanner modal if open
      setScannerModalOpen(false);
    },
  });

  function handleDeleteImage(imageId: string) {
    setImages(prev => {
      const imageToDelete = prev.find(img => img.id === imageId);
      if (imageToDelete?.preview && !imageToDelete.preview.startsWith("http")) {
        URL.revokeObjectURL(imageToDelete.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  }

  // ========================================================================
  // UPLOAD & EXTRACTION
  // ========================================================================
  async function uploadImage(image: UploadedImage): Promise<string | null> {
    try {
      const presignedResponse = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: image.file.name,
          contentType: image.file.type,
          size: image.file.size,
          isImage: true,
          fileType: "connect-card",
          organizationSlug: slug,
          cardSide: "front",
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json().catch(() => ({}));
        console.error(
          "Presigned URL error:",
          presignedResponse.status,
          errorData
        );
        throw new Error(errorData.error || "Failed to get presigned URL");
      }

      const { presignedUrl, key } = await presignedResponse.json();

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": image.file.type },
        body: image.file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to S3");
      }

      return key;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  }

  async function extractData(
    _imageKey: string,
    imageFile: File
  ): Promise<{ data: ExtractedData; imageHash: string }> {
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const response = await fetch("/api/connect-cards/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageData: base64Image,
        mediaType: imageFile.type,
        organizationSlug: slug,
      }),
    });

    const result = await response.json();

    if (response.status === 409 && result.duplicate) {
      const error = new Error(
        result.message || "Duplicate image detected"
      ) as Error & {
        isDuplicate: boolean;
        existingCard: { id: string; name: string; scannedAt: string };
      };
      error.isDuplicate = true;
      error.existingCard = result.existingCard;
      throw error;
    }

    if (!response.ok) {
      throw new Error(result.error || "Extraction failed");
    }

    return {
      data: normalizeExtractedData(result.data as Record<string, unknown>),
      imageHash: result.imageHash,
    };
  }

  // ========================================================================
  // PROCESS ALL HANDLER
  // ========================================================================
  async function handleProcessAll() {
    startProcessing(async () => {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        if (image.saved) continue;

        // Step 1: Upload to S3
        setImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, uploading: true } : img
          )
        );

        const key = await uploadImage(image);

        if (!key) {
          setImages(prev =>
            prev.map(img =>
              img.id === image.id
                ? { ...img, uploading: false, error: true }
                : img
            )
          );
          continue;
        }

        setImages(prev =>
          prev.map(img =>
            img.id === image.id
              ? { ...img, uploading: false, uploaded: true, key }
              : img
          )
        );

        // Step 2: Extract data
        setImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, extracting: true } : img
          )
        );

        try {
          const { data: extractedData, imageHash } = await extractData(
            key,
            image.file
          );

          const warnings = validateExtractedData(extractedData);
          if (warnings.length > 0) {
            toast.warning(`${image.file.name}: ${warnings.join(", ")}`, {
              duration: 3000,
            });
          }

          setImages(prev =>
            prev.map(img =>
              img.id === image.id
                ? {
                    ...img,
                    extracting: false,
                    extracted: true,
                    extractedData,
                    imageHash,
                  }
                : img
            )
          );

          // Step 3: Save to database
          const saveResult = await saveConnectCard(
            slug,
            {
              imageKey: key,
              imageHash,
              extractedData,
            },
            defaultLocationId
          );

          if (saveResult.status === "success") {
            if (!activeBatch) {
              const batchResult = await getActiveBatchAction(slug);
              if (batchResult.status === "success" && batchResult.data) {
                setActiveBatch(batchResult.data);
                router.refresh();
              }
            }

            setImages(prev =>
              prev.map(img =>
                img.id === image.id
                  ? {
                      ...img,
                      saved: true,
                      savedId: saveResult.data?.id,
                    }
                  : img
              )
            );
          } else {
            const isDuplicate =
              saveResult.message?.includes("Duplicate") ||
              saveResult.message?.includes("duplicate");
            const duplicateData = saveResult.data as {
              duplicateType?: "image" | "person";
            };

            setImages(prev =>
              prev.map(img =>
                img.id === image.id
                  ? {
                      ...img,
                      error: true,
                      isDuplicate,
                      duplicateType: duplicateData?.duplicateType,
                      duplicateMessage: saveResult.message,
                    }
                  : img
              )
            );

            if (isDuplicate) {
              toast.warning(saveResult.message || "Duplicate card detected");
            } else {
              toast.error("Failed to save card");
            }
          }
        } catch (error) {
          const isDuplicateError =
            error instanceof Error &&
            (error as Error & { isDuplicate?: boolean }).isDuplicate;

          if (isDuplicateError) {
            setImages(prev =>
              prev.map(img =>
                img.id === image.id
                  ? {
                      ...img,
                      extracting: false,
                      error: true,
                      isDuplicate: true,
                      duplicateType: "image",
                      duplicateMessage:
                        error instanceof Error
                          ? error.message
                          : "Duplicate detected",
                    }
                  : img
              )
            );
            toast.warning(
              error instanceof Error ? error.message : "Duplicate card detected"
            );
          } else {
            setImages(prev =>
              prev.map(img =>
                img.id === image.id
                  ? { ...img, extracting: false, error: true }
                  : img
              )
            );
          }
        }
      }

      const allSaved = images.every(img => img.saved || img.error);
      if (allSaved) {
        toast.success("All cards processed!");
      }
    });
  }

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================
  const savedCount = images.filter(img => img.saved).length;
  const duplicateCount = images.filter(img => img.isDuplicate).length;
  const errorCount = images.filter(img => img.error && !img.isDuplicate).length;
  const processedCount = savedCount + duplicateCount + errorCount;
  const isAllProcessed = images.length > 0 && processedCount === images.length;

  function handleNewUploadSession() {
    setImages([]);
    toast.info("Ready for new upload session");
  }

  // ========================================================================
  // RENDER: Processing State (images selected)
  // ========================================================================
  if (images.length > 0) {
    return (
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {!isAllProcessed && !isProcessing && (
              <>
                <Button variant="outline" size="lg" onClick={openFilePicker}>
                  <FileImage className="mr-2 w-4 h-4" />
                  Add More
                </Button>
                <Button onClick={handleProcessAll} size="lg">
                  <CheckCircle2 className="mr-2 w-5 h-5" />
                  Process All Cards
                </Button>
              </>
            )}

            {isProcessing && (
              <Button disabled size="lg">
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Processing {savedCount} of {images.length}...
              </Button>
            )}

            {isAllProcessed && !isProcessing && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleNewUploadSession}
              >
                <Upload className="mr-2 w-4 h-4" />
                Upload More
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={handleNewUploadSession}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="mr-2 w-4 h-4" />
            Cancel
          </Button>
        </div>

        {/* Batch Indicator */}
        {activeBatch && !isAllProcessed && (
          <Alert className="mb-4">
            <Package className="h-4 w-4" />
            <AlertDescription>
              Cards will be added to batch:{" "}
              <span className="font-semibold text-primary">
                {activeBatch.name}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Batch Summary (after processing) */}
        {activeBatch && isAllProcessed && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">
                    Batch &quot;{activeBatch.name}&quot; complete
                  </p>
                </div>
                {savedCount > 0 && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/church/${slug}/admin/connect-cards/review/${activeBatch.id}`
                      )
                    }
                  >
                    <ClipboardCheck className="mr-2 w-4 h-4" />
                    Review Batch
                  </Button>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-4 text-sm border-t pt-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Saved:</span>
                  <span className="font-semibold">{savedCount}</span>
                </div>
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Duplicates:</span>
                    <span className="font-semibold">{duplicateCount}</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-semibold">{errorCount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {isProcessing && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing connect cards...</span>
                  <span>
                    {savedCount} / {images.length} complete
                  </span>
                </div>
                <Progress
                  value={(savedCount / images.length) * 100}
                  className="h-2"
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(image => (
            <Card key={image.id} className="overflow-hidden relative group">
              {!isProcessing &&
                !image.saved &&
                !image.error &&
                !image.uploading && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10 transition-all hover:scale-110 hover:shadow-lg"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}

              <div className="aspect-square relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.preview}
                  alt="Connect card"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  {image.uploading && (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  )}
                  {image.extracting && (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  )}
                  {image.saved && (
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  )}
                  {image.error && !image.isDuplicate && (
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  )}
                  {image.isDuplicate && (
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                      <span className="text-xs text-yellow-500 font-semibold">
                        {image.duplicateType === "image"
                          ? "Duplicate Image"
                          : "Duplicate Person"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {image.file.name}
                </p>
                <div className="text-xs font-medium space-y-1">
                  <p className="flex items-center gap-1.5">
                    {image.uploading && "Uploading..."}
                    {image.uploaded &&
                      !image.extracting &&
                      !image.isDuplicate &&
                      !image.error &&
                      "Uploaded"}
                    {image.extracting && "Analyzing..."}
                    {image.extracted &&
                      !image.saved &&
                      !image.error &&
                      "Saving..."}
                    {image.saved && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        <span>Saved</span>
                      </>
                    )}
                    {(image.isDuplicate || (image.error && image.uploaded)) &&
                      "Uploaded"}
                  </p>
                  {image.isDuplicate && (
                    <p
                      className="text-yellow-600 flex items-center gap-1"
                      title={image.duplicateMessage}
                    >
                      {image.duplicateType === "image"
                        ? "Duplicate Image"
                        : "Duplicate Person"}
                    </p>
                  )}
                  {image.error && !image.isDuplicate && (
                    <p className="text-destructive flex items-center gap-1">
                      Failed
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Setup Page (no images yet)
  // ========================================================================
  return (
    <div className="space-y-6">
      {/* Upload Options Card */}
      <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5 blur-xl" />

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Upload Connect Cards</h2>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                if (isMobile) {
                  router.push(`/church/${slug}/admin/connect-cards/scan`);
                } else {
                  handleOpenQrModal();
                }
              }}
              className="group relative overflow-hidden rounded-lg border-2 border-primary bg-primary/5 p-5 text-left transition-all hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Scan with Phone</p>
                  <p className="text-sm text-muted-foreground">
                    Use your phone camera
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Recommended
                </span>
              </div>
            </button>

            <button
              onClick={() => setScannerModalOpen(true)}
              className="group relative overflow-hidden rounded-lg border-2 border-border bg-card/50 p-5 text-left transition-all hover:border-muted-foreground/50 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-hover:scale-110 group-hover:bg-muted-foreground/20">
                  <FileImage className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Document Scanner</p>
                  <p className="text-sm text-muted-foreground">
                    Use a flatbed or sheet-fed scanner
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Drop Zone - with "Already scanned?" header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ScanLine className="h-4 w-4" />
          <span>Already scanned your cards? Drop the files below.</span>
        </div>
        <div
          {...getRootProps()}
          className={`group relative overflow-hidden rounded-lg border-2 border-dashed transition-all cursor-pointer ${
            isDragActive
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full mb-4 transition-all ${
                isDragActive
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              }`}
            >
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragActive ? "Drop files here..." : "Drag and drop images"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse your files
            </p>
          </div>
        </div>
      </div>

      {/* Help Guide - Collapsible */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Need help?</CardTitle>
                </div>
                {showHelp ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Phone Camera Help */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Using Phone Camera
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Click &quot;Scan with Phone&quot; to get a QR code</li>
                    <li>Scan the QR with your phone camera</li>
                    <li>Capture each card, front and back</li>
                  </ol>
                </div>
                {/* Document Scanner Help */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Using Document Scanner
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Scan cards as JPG/PNG images (not PDF)</li>
                    <li>Click &quot;Upload Files&quot; or drag to drop zone</li>
                    <li>AI will extract the information automatically</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* QR Code Modal (Desktop only) */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Scan with Your Phone
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your phone camera to start capturing
              connect cards. The link expires in 15 minutes.
            </DialogDescription>
          </DialogHeader>

          {/* Card Type Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Card Type</Label>
            <Select
              value={cardSide}
              onValueChange={v => setCardSide(v as CardSide)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="double">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>Double-sided cards</span>
                  </div>
                </SelectItem>
                <SelectItem value="single">
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    <span>Single-sided cards</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {cardSide === "double"
                ? "You'll capture front and back of each card"
                : "You'll capture one side per card"}
            </p>
          </div>

          <div className="flex flex-col items-center py-4">
            {qrLoading ? (
              <div className="h-64 w-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : scanUrl ? (
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={scanUrl}
                  size={256}
                  level="M"
                  marginSize={0}
                />
              </div>
            ) : (
              <div className="h-64 w-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-center px-4">
                  Failed to generate QR code.
                  <br />
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={generateQrCode}
                  >
                    Try again
                  </Button>
                </p>
              </div>
            )}

            {qrExpiry && (
              <p className="text-xs text-muted-foreground mt-4">
                Expires at{" "}
                {qrExpiry.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={copyLinkToClipboard}
              disabled={!scanUrl}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Or copy the link and text/email it to yourself
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Scanner Modal */}
      <Dialog open={scannerModalOpen} onOpenChange={setScannerModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Document Scanner
            </DialogTitle>
            <DialogDescription>
              Connect your scanner folder for automatic uploads
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Folder Connection Status */}
            {isWatching && watchedFolderName ? (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                      <FolderSync className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Watching for new scans
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Folder: {watchedFolderName}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnectFolder}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Disconnect
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Just scan your cards — they&apos;ll appear here automatically.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Auto-detect scanned cards
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect your scanner&apos;s output folder and we&apos;ll
                      automatically detect new scans. No more dragging files!
                    </p>
                  </div>
                </div>
                <Button onClick={handleConnectFolder} className="w-full">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Connect Scanner Folder
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Works in Chrome &amp; Edge • Read-only access • You choose the
                  folder
                </p>
              </div>
            )}

            {/* Setup help link */}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <HelpCircle className="h-3 w-3" />
              <span>First time?</span>
              <a
                href="#"
                className="text-primary underline underline-offset-2 hover:no-underline inline-flex items-center gap-1"
                onClick={e => {
                  e.preventDefault();
                  toast.info("Setup guide coming soon!");
                }}
              >
                Setup instructions
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Tips */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium mb-1.5">Scanner settings</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Save as JPG or PNG (not PDF)</li>
                <li>• 300 DPI for best results</li>
              </ul>
            </div>

            {/* Double-sided note */}
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <p className="text-xs">
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Double-sided cards?
                </span>{" "}
                Use{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2 hover:no-underline"
                  onClick={() => {
                    setScannerModalOpen(false);
                    if (isMobile) {
                      router.push(`/church/${slug}/admin/connect-cards/scan`);
                    } else {
                      handleOpenQrModal();
                    }
                  }}
                >
                  phone camera
                </button>{" "}
                if your scanner doesn&apos;t have duplex.
              </p>
            </div>
          </div>

          {/* Manual drop zone as fallback */}
          <div
            {...getRootProps()}
            className={`rounded-lg border-2 border-dashed transition-all cursor-pointer ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? "Drop files here..."
                  : "Or drop files here manually"}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setScannerModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
