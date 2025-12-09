"use client";
// Force rebuild for tab styling
import { useState, useTransition, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Trash2,
  X,
  FileText,
  Save,
  TestTube,
  ClipboardCheck,
  MapPin,
  Package,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { saveConnectCard } from "@/actions/connect-card/save-connect-card";
import { getActiveBatchAction } from "@/actions/connect-card/batch-actions";
import { useDropzone } from "react-dropzone";

// Type for extracted connect card data (matches Zod schema in lib/zodSchemas.ts)
interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request: string | null;
  visit_status?: string | null; // New field from AI extraction
  first_time_visitor?: boolean | null; // Legacy field - optional
  interests: string[] | null;
  address: string | null;
  age_group: string | null;
  family_info: string | null;
  // Changed from unknown to string | null for type safety
  // AI may return any shape - we coerce to string in normalizeExtractedData()
  additional_notes: string | null;
}

/**
 * Normalizes AI-extracted data to match schema requirements
 * Handles edge cases where AI returns unexpected types
 */
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
    // Coerce any additional_notes to string (JSON stringify if object)
    additional_notes:
      data.additional_notes === null || data.additional_notes === undefined
        ? null
        : typeof data.additional_notes === "string"
          ? data.additional_notes
          : JSON.stringify(data.additional_notes),
  };
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  key?: string;
  imageHash?: string; // SHA-256 hash from extract API for duplicate detection
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

type UploadMode = "files" | "camera" | "test";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface UploadClientProps {
  locations: Location[];
  defaultLocationId: string | null;
}

export function ConnectCardUploadClient({
  locations,
  defaultLocationId,
}: UploadClientProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [uploadMode, setUploadMode] = useState<UploadMode>("files");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    defaultLocationId
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, startProcessing] = useTransition();
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Active batch state
  const [activeBatch, setActiveBatch] = useState<{
    id: string;
    name: string;
    cardCount: number;
  } | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(true);

  // DO NOT fetch/create batch on mount - only create when uploading
  // This prevents empty batches from being created just by viewing the page
  useEffect(() => {
    setLoadingBatch(false);
  }, []);

  // Test mode state
  const [testImage, setTestImage] = useState<File | null>(null);
  const [testPreview, setTestPreview] = useState<string | null>(null);
  const [testImageKey, setTestImageKey] = useState<string | null>(null);
  const [testImageHash, setTestImageHash] = useState<string | null>(null);
  const [testExtracting, setTestExtracting] = useState(false);
  const [testExtractedData, setTestExtractedData] =
    useState<ExtractedData | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSavedId, setTestSavedId] = useState<string | null>(null);
  const [testSaving, startTestSaving] = useTransition();
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Drag and drop handler
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    disabled: isProcessing,
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
    },
  });

  // Camera capture handler
  function handleCameraCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = Array.from(files).map(file => ({
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
    toast.success(`Added ${files.length} photo${files.length > 1 ? "s" : ""}`);

    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }

  // Delete image handler
  function handleDeleteImage(imageId: string) {
    setImages(prev => {
      const imageToDelete = prev.find(img => img.id === imageId);
      if (imageToDelete?.preview && !imageToDelete.preview.startsWith("http")) {
        URL.revokeObjectURL(imageToDelete.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  }

  // Upload single image to S3
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
          cardSide: "front", // Bulk upload treats each image as front (TODO: front/back pairing)
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { presignedUrl, key } = await presignedResponse.json();

      // Upload to S3
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

  // Extract data from image using base64
  // Returns both extracted data and imageHash for duplicate detection
  async function extractData(
    imageKey: string,
    imageFile: File
  ): Promise<{ data: ExtractedData; imageHash: string }> {
    console.log("🔍 Extracting data from image:", imageFile.name);

    // Convert image to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
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

    // Handle duplicate detection (409 response)
    if (response.status === 409 && result.duplicate) {
      console.warn("⚠️ Duplicate image detected:", result.existingCard);
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
      console.error("❌ Extraction API error:", result);
      throw new Error(result.error || "Extraction failed");
    }

    console.log("✅ Extraction complete:", result);
    // Return both normalized data and imageHash from extract API
    return {
      data: normalizeExtractedData(result.data as Record<string, unknown>),
      imageHash: result.imageHash,
    };
  }

  // Process all images
  async function handleProcessAll() {
    startProcessing(async () => {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // Skip if already processed
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

        // Step 2: Extract data with Claude (duplicate check happens here BEFORE Claude call)
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

          // Validate extracted data
          const warnings = validateExtractedData(extractedData);
          if (warnings.length > 0) {
            console.warn(
              `⚠️ Validation warnings for ${image.file.name}:`,
              warnings
            );
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
              imageHash, // Pass the hash from extract API
              extractedData,
            },
            selectedLocationId
          );

          if (saveResult.status === "success") {
            // Fetch active batch info after first successful save
            // (batch is created during save if it doesn't exist)
            if (!activeBatch) {
              const batchResult = await getActiveBatchAction(slug);
              if (batchResult.status === "success" && batchResult.data) {
                setActiveBatch(batchResult.data);
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
            // Check if it's a duplicate error
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

            // Show specific duplicate toast
            if (isDuplicate) {
              toast.warning(saveResult.message || "Duplicate card detected");
            } else {
              toast.error("Failed to save card");
            }
          }
        } catch (error) {
          // Check if it's a duplicate error from extract API
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

      // Check if all are complete
      const allSaved = images.every(img => img.saved || img.error);
      if (allSaved) {
        toast.success("All cards processed!");
      }
    });
  }

  // Test mode handlers
  function handleTestImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setTestImage(file);
    setTestPreview(URL.createObjectURL(file));
    setTestImageKey(null);
    setTestImageHash(null);
    setTestExtractedData(null);
    setTestError(null);
    setTestSavedId(null);
  }

  // Validate extracted data for common issues
  function validateExtractedData(data: ExtractedData): string[] {
    const warnings: string[] = [];

    // Phone number validation
    if (data.phone) {
      const digits = data.phone.replace(/\D/g, ""); // Remove non-digits
      if (digits.length < 10) {
        warnings.push(
          `Phone number has only ${digits.length} digits (expected 10+)`
        );
      } else if (digits.length > 11) {
        warnings.push(
          `Phone number has ${digits.length} digits (expected 10-11)`
        );
      }
      // Check for obviously wrong patterns
      if (/^(.)\1+$/.test(digits)) {
        warnings.push("Phone number appears to be all same digit");
      }
    }

    // Email validation (basic)
    if (data.email && !data.email.includes("@")) {
      warnings.push("Email address missing @ symbol");
    }

    // Name validation
    if (data.name && data.name.length < 2) {
      warnings.push("Name seems too short");
    }

    return warnings;
  }

  async function handleTestExtract() {
    if (!testImage) {
      setTestError("Please upload an image first");
      return;
    }

    setTestExtracting(true);
    setTestError(null);
    setTestExtractedData(null);
    setTestImageHash(null);

    try {
      console.log("🔍 Extracting data from test image:", testImage.name);

      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(testImage);
      });

      const response = await fetch("/api/connect-cards/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: base64Image,
          mediaType: testImage.type,
          organizationSlug: slug,
        }),
      });

      const result = await response.json();

      // Handle duplicate detection (409 response)
      if (response.status === 409 && result.duplicate) {
        throw new Error(result.message || "Duplicate image detected");
      }

      if (!response.ok) {
        throw new Error(result.error || "Extraction failed");
      }

      console.log("✅ Test extraction complete:", result);

      // Validate extracted data
      const warnings = validateExtractedData(result.data);
      if (warnings.length > 0) {
        console.warn("⚠️ Validation warnings:", warnings);
        toast.warning(`Data extracted with warnings: ${warnings.join(", ")}`, {
          duration: 5000,
        });
      } else {
        toast.success("Data extracted successfully!");
      }

      setTestExtractedData(result.data);
      setTestImageHash(result.imageHash); // Store hash for save action
    } catch (error) {
      console.error("❌ Test extraction error:", error);
      setTestError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setTestExtracting(false);
    }
  }

  async function handleTestSave() {
    if (!testImage || !testExtractedData || !testImageHash) return;

    startTestSaving(async () => {
      try {
        // Upload to S3 first if not already uploaded
        let imageKey = testImageKey;
        if (!imageKey) {
          const presignedResponse = await fetch("/api/s3/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: testImage.name,
              contentType: testImage.type,
              size: testImage.size,
              isImage: true,
              fileType: "connect-card",
              organizationSlug: slug,
              cardSide: "front",
            }),
          });

          if (!presignedResponse.ok) {
            throw new Error("Failed to get presigned URL");
          }

          const { presignedUrl, key } = await presignedResponse.json();

          const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            headers: { "Content-Type": testImage.type },
            body: testImage,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload to S3");
          }

          imageKey = key;
          setTestImageKey(key);
        }

        // Save to database
        const result = await saveConnectCard(
          slug,
          {
            imageKey: imageKey!,
            imageHash: testImageHash, // Pass the hash from extract API
            extractedData: testExtractedData,
          },
          selectedLocationId
        );

        if (result.status === "success") {
          // Fetch active batch info after first successful save
          if (!activeBatch) {
            const batchResult = await getActiveBatchAction(slug);
            if (batchResult.status === "success" && batchResult.data) {
              setActiveBatch(batchResult.data);
            }
          }
          toast.success("Connect card saved to database!");
          setTestSavedId(result.data?.id || null);
        } else {
          toast.error(result.message);
          setTestError(result.message);
        }
      } catch (error) {
        console.error("Save error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save";
        toast.error(errorMessage);
        setTestError(errorMessage);
      }
    });
  }

  function handleTestReset() {
    setTestImage(null);
    setTestPreview(null);
    setTestImageKey(null);
    setTestImageHash(null);
    setTestExtractedData(null);
    setTestError(null);
    setTestSavedId(null);
  }

  const savedCount = images.filter(img => img.saved).length;
  const duplicateCount = images.filter(img => img.isDuplicate).length;
  const errorCount = images.filter(img => img.error && !img.isDuplicate).length;
  const processedCount = savedCount + duplicateCount + errorCount;
  const isAllProcessed = images.length > 0 && processedCount === images.length;

  // Reset to start new upload session
  function handleNewUploadSession() {
    setImages([]);
    toast.info("Ready for new upload session");
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        {/* Left side - Primary actions */}
        <div className="flex gap-3">
          {/* State 1: Images added, not all processed yet */}
          {images.length > 0 && !isAllProcessed && !isProcessing && (
            <>
              {/* Add More Images - Only before processing */}
              {uploadMode === "files" ? (
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <Button variant="outline" size="lg">
                    <FileImage className="mr-2 w-4 h-4" />
                    Add More Images
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="mr-2 w-4 h-4" />
                  Take More Photos
                </Button>
              )}

              {/* Process All Cards */}
              <Button onClick={handleProcessAll} size="lg">
                <CheckCircle2 className="mr-2 w-5 h-5" />
                Process All Cards
              </Button>
            </>
          )}

          {/* State 2: Processing in progress */}
          {isProcessing && (
            <Button disabled size="lg">
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Processing {savedCount} of {images.length}...
            </Button>
          )}

          {/* State 3: Processing complete */}
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

        {/* Right side - Cancel button (clears upload session) */}
        {images.length > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleNewUploadSession}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="mr-2 w-4 h-4" />
            Cancel
          </Button>
        )}
      </div>

      {/* Removed separate stat cards - now combined in batch completion card below */}

      {/* Upload Tabs */}
      {images.length === 0 && !testPreview && (
        <Tabs
          defaultValue="files"
          value={uploadMode}
          onValueChange={value => setUploadMode(value as UploadMode)}
          className="w-full"
        >
          {/* Step 1: Verify Location */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <h3 className="text-lg font-semibold">Verify Location</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select the campus location where these connect cards were
              collected.
            </p>
            {locations.length > 0 && (
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="location-select"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location:
                </Label>
                <Select
                  value={selectedLocationId || ""}
                  onValueChange={value =>
                    setSelectedLocationId(value || defaultLocationId)
                  }
                >
                  <SelectTrigger className="w-[200px]" id="location-select">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Step 2: Upload Connect Cards */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <h3 className="text-lg font-semibold">Upload Connect Cards</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your upload method below.
            </p>
          </div>

          <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs rtl:space-x-reverse mb-6">
            <TabsTrigger
              value="files"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
            >
              <FileImage className="mr-2 w-4 h-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger
              value="camera"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
            >
              <Camera className="mr-2 w-4 h-4" />
              Mobile Scan
            </TabsTrigger>
            <TabsTrigger
              value="test"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
            >
              <TestTube className="mr-2 w-4 h-4" />
              Test Single
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files">
            {/* Batch Creation Info */}
            <Alert className="mb-4">
              <Package className="h-4 w-4" />
              <AlertDescription>
                {(() => {
                  const selectedLocation = locations.find(
                    loc => loc.id === selectedLocationId
                  );
                  const today = new Date();
                  const monthNames = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ];
                  const batchName = selectedLocation
                    ? `${selectedLocation.name} - ${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`
                    : "Select a location to create a batch";
                  return (
                    <>
                      Uploading cards will create batch:{" "}
                      <span className="font-semibold text-primary">
                        {batchName}
                      </span>
                    </>
                  );
                })()}
              </AlertDescription>
            </Alert>

            <Card
              {...getRootProps()}
              className={`border-2 border-dashed transition-colors cursor-pointer ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary"
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive
                    ? "Drop images here..."
                    : "Drag & drop connect card images"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <Button>Select Images</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Mobile Scanner</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Scan connect cards using your device&apos;s camera with a live
                  viewfinder. Supports both single and two-sided cards.
                </p>
                <div className="flex flex-col gap-3 items-center">
                  <Button size="lg" asChild>
                    <Link href={`/church/${slug}/admin/connect-cards/scan`}>
                      <Camera className="mr-2 w-5 h-5" />
                      Launch Scanner
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Best on mobile devices
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            {!testPreview ? (
              <>
                {/* Batch Creation Info */}
                <Alert className="mb-4">
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    {(() => {
                      const selectedLocation = locations.find(
                        loc => loc.id === selectedLocationId
                      );
                      const today = new Date();
                      const monthNames = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];
                      const batchName = selectedLocation
                        ? `${selectedLocation.name} - ${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`
                        : "Select a location to create a batch";
                      return (
                        <>
                          Test mode - Cards will be saved to batch:{" "}
                          <span className="font-semibold text-primary">
                            {batchName}
                          </span>
                        </>
                      );
                    })()}
                  </AlertDescription>
                </Alert>

                {/* Test Image Upload */}
                <Card className="border-2 border-dashed border-border">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      Test Single Connect Card
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a connect card image to test extraction
                    </p>
                    <Button
                      onClick={() =>
                        document.getElementById("test-file-input")?.click()
                      }
                    >
                      Choose Image
                    </Button>
                    <input
                      id="test-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleTestImageSelect}
                    />
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      )}

      {/* Test Mode - Full Page View */}
      {testPreview && (
        <div className="space-y-6">
          {/* Test Mode Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {!testExtractedData && !testExtracting && (
                <Button onClick={handleTestExtract} size="lg">
                  <CheckCircle2 className="mr-2 w-5 h-5" />
                  Extract Data
                </Button>
              )}

              {testExtracting && (
                <Button disabled size="lg">
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Extracting...
                </Button>
              )}

              {testExtractedData && !testSavedId && (
                <Button
                  onClick={handleTestSave}
                  disabled={testSaving}
                  size="lg"
                >
                  {testSaving ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 w-5 h-5" />
                      Save to Database
                    </>
                  )}
                </Button>
              )}

              {testSavedId && (
                <Button variant="outline" size="lg" onClick={handleTestReset}>
                  <Upload className="mr-2 w-4 h-4" />
                  Test Another Card
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={handleTestReset}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="mr-2 w-4 h-4" />
              Cancel
            </Button>
          </div>

          {/* Error Alert */}
          {testError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}

          {/* Test Card Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Connect Card Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="relative rounded-lg overflow-hidden border cursor-zoom-in hover:opacity-90 transition-opacity aspect-[3/4]"
                  onClick={() => setImageModalOpen(true)}
                  title="Click to view full size"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={testPreview}
                    alt="Test connect card"
                    className="w-full h-full object-contain bg-muted"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Extracted Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extracted Data</CardTitle>
              </CardHeader>
              <CardContent>
                {!testExtractedData && !testError && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No data extracted yet</p>
                    <p className="text-sm mt-2">
                      Click &quot;Extract Data&quot; to process
                    </p>
                  </div>
                )}

                {testExtractedData && (
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-auto max-h-[500px]">
                      {JSON.stringify(testExtractedData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <>
          {/* Simple Batch Indicator - Only show before processing complete */}
          {activeBatch && !loadingBatch && savedCount < images.length && (
            <Alert className="mb-4">
              <Package className="h-4 w-4" />
              <AlertDescription>
                These cards will be added to batch:{" "}
                <span className="font-semibold text-primary">
                  {activeBatch.name}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Batch Summary - Only show after all cards processed (saved, duplicate, or error) */}
          {activeBatch && !loadingBatch && isAllProcessed && (
            <Card className="mb-6">
              <CardContent className="py-4">
                {/* Header row: Batch name + Review button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
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

                {/* Stats row - compact inline display */}
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
                {/* Delete Button - Only show for unprocessed cards */}
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
                  {/* Status Overlay */}
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
                        ⚠️{" "}
                        {image.duplicateType === "image"
                          ? "Duplicate Image"
                          : "Duplicate Person"}
                      </p>
                    )}
                    {image.error && !image.isDuplicate && (
                      <p className="text-destructive flex items-center gap-1">
                        ❌ Failed
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Hidden camera input for camera mode */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleCameraCapture}
      />

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent
          className="p-2 [&>button]:bg-white [&>button]:text-black [&>button]:hover:bg-gray-200 [&>button]:rounded-full [&>button]:h-10 [&>button]:w-10 [&>button]:flex [&>button]:items-center [&>button]:justify-center"
          style={{
            maxWidth: "90vw",
            width: "90vw",
            maxHeight: "calc(100vh - 4rem)",
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Connect Card Image</DialogTitle>
          </DialogHeader>
          {testPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={testPreview}
              alt="Connect card full size"
              className="w-full h-auto object-contain"
              style={{ maxHeight: "calc(100vh - 5rem)" }}
              decoding="async"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
