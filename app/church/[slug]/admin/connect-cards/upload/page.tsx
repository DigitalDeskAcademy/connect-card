"use client";
// Force rebuild for tab styling
import { useState, useTransition, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout/page-container";
import {
  Upload,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Camera,
  Trash2,
  X,
  FileText,
  Save,
  TestTube,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { saveConnectCard } from "@/actions/connect-card/save-connect-card";
import { useDropzone } from "react-dropzone";

// Type for extracted connect card data (matches Zod schema)
interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request: string | null;
  first_time_visitor: boolean | null;
  interests: string[] | null;
  address: string | null;
  age_group: string | null;
  family_info: string | null;
  additional_notes?: unknown;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  key?: string;
  uploading: boolean;
  uploaded: boolean;
  error: boolean;
  extracting: boolean;
  extracted: boolean;
  extractedData?: ExtractedData;
  saved: boolean;
  savedId?: string;
}

type UploadMode = "files" | "camera" | "test";

export default function ConnectCardUploadPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [uploadMode, setUploadMode] = useState<UploadMode>("files");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, startProcessing] = useTransition();
  const [allComplete, setAllComplete] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Test mode state
  const [testImage, setTestImage] = useState<File | null>(null);
  const [testPreview, setTestPreview] = useState<string | null>(null);
  const [testImageKey, setTestImageKey] = useState<string | null>(null);
  const [testExtracting, setTestExtracting] = useState(false);
  const [testExtractedData, setTestExtractedData] =
    useState<ExtractedData | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSavedId, setTestSavedId] = useState<string | null>(null);
  const [testSaving, startTestSaving] = useTransition();

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
          fileType: "asset",
          organizationSlug: slug,
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
  async function extractData(
    imageKey: string,
    imageFile: File
  ): Promise<ExtractedData> {
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Extraction API error:", errorData);
      throw new Error(errorData.error || "Extraction failed");
    }

    const result = await response.json();
    console.log("✅ Extraction complete:", result);
    return result.data;
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

        // Step 2: Extract data with Claude
        setImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, extracting: true } : img
          )
        );

        try {
          const extractedData = await extractData(key, image.file);

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
                ? { ...img, extracting: false, extracted: true, extractedData }
                : img
            )
          );

          // Step 3: Save to database
          const saveResult = await saveConnectCard(slug, {
            imageKey: key,
            extractedData,
          });

          if (saveResult.status === "success") {
            setImages(prev =>
              prev.map(img =>
                img.id === image.id
                  ? { ...img, saved: true, savedId: saveResult.data?.id }
                  : img
              )
            );
          } else {
            setImages(prev =>
              prev.map(img =>
                img.id === image.id ? { ...img, error: true } : img
              )
            );
          }
        } catch (error) {
          console.error("Processing error:", error);
          setImages(prev =>
            prev.map(img =>
              img.id === image.id
                ? { ...img, extracting: false, error: true }
                : img
            )
          );
        }
      }

      // Check if all are complete
      const allSaved = images.every(img => img.saved || img.error);
      if (allSaved) {
        setAllComplete(true);
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Extraction failed");
      }

      const result = await response.json();
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
    } catch (error) {
      console.error("❌ Test extraction error:", error);
      setTestError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setTestExtracting(false);
    }
  }

  async function handleTestSave() {
    if (!testImage || !testExtractedData) return;

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
              fileType: "asset",
              organizationSlug: slug,
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
        const result = await saveConnectCard(slug, {
          imageKey: imageKey!,
          extractedData: testExtractedData,
        });

        if (result.status === "success") {
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
    setTestExtractedData(null);
    setTestError(null);
    setTestSavedId(null);
  }

  const savedCount = images.filter(img => img.saved).length;
  const errorCount = images.filter(img => img.error).length;

  // Reset to start new upload session
  function handleNewUploadSession() {
    setImages([]);
    setAllComplete(false);
    toast.info("Ready for new upload session");
  }

  return (
    <PageContainer>
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push(`/church/${slug}/admin`)}
        className="mb-4 h-11"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Upload Tabs */}
      {images.length === 0 && (
        <Tabs
          defaultValue="files"
          value={uploadMode}
          onValueChange={value => setUploadMode(value as UploadMode)}
          className="w-full"
        >
          <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs rtl:space-x-reverse">
            <TabsTrigger
              value="files"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
            >
              <FileImage className="mr-2 w-4 h-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger
              value="camera"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary md:hidden"
            >
              <Camera className="mr-2 w-4 h-4" />
              Scan with Camera
            </TabsTrigger>
            <TabsTrigger
              value="test"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
            >
              <TestTube className="mr-2 w-4 h-4" />
              Test Single
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="mt-6">
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
                <Button variant="outline">Select Images</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera" className="mt-6">
            <Card className="border-2 border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Use Your Phone Camera
                </p>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Click the button below to open your camera. Take a photo of
                  each connect card (front and back if needed).
                </p>
                <Button
                  size="lg"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="mr-2 w-5 h-5" />
                  Open Camera
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Tip: Take multiple photos in sequence
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left side - Image upload and preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Upload Test Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!testPreview ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="aspect-video relative rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={testPreview}
                          alt="Test connect card"
                          className="w-full h-full object-contain bg-muted"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleTestExtract}
                          disabled={testExtracting}
                          className="flex-1"
                          size="lg"
                        >
                          {testExtracting ? (
                            <>
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 w-5 h-5" />
                              Extract Data
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={handleTestReset}
                          disabled={testExtracting || testSaving}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right side - Extracted data display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Extracted Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{testError}</AlertDescription>
                    </Alert>
                  )}

                  {!testExtractedData && !testError && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No data extracted yet</p>
                      <p className="text-sm mt-2">
                        Upload an image and click Extract Data
                      </p>
                    </div>
                  )}

                  {testExtractedData && (
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-xs overflow-auto max-h-96">
                          {JSON.stringify(testExtractedData, null, 2)}
                        </pre>
                      </div>

                      {!testSavedId ? (
                        <Button
                          onClick={handleTestSave}
                          disabled={testSaving}
                          className="w-full"
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
                      ) : (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Saved successfully! ID: {testSavedId}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Completion Summary - Show when all processing is done */}
      {allComplete && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Processing Complete!</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  All connect cards have been processed and are ready for review
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-background rounded-lg border">
                <div className="text-3xl font-bold text-green-600">
                  {savedCount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Cards Processed
                </div>
              </div>
              <div className="flex flex-col items-center p-4 bg-background rounded-lg border">
                <div className="text-3xl font-bold text-blue-600">
                  {savedCount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Sent to Review
                </div>
              </div>
              {errorCount > 0 && (
                <div className="flex flex-col items-center p-4 bg-background rounded-lg border">
                  <div className="text-3xl font-bold text-destructive">
                    {errorCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Failed
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handleNewUploadSession}
                className="flex-1"
              >
                <Upload className="mr-2 w-5 h-5" />
                New Upload Session
              </Button>
              <Button
                size="lg"
                onClick={() =>
                  router.push(`/church/${slug}/admin/connect-cards/review`)
                }
                className="flex-1"
              >
                <ClipboardCheck className="mr-2 w-5 h-5" />
                Review Queue ({savedCount})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Grid + Actions */}
      {images.length > 0 && !allComplete && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span>Total: {images.length}</span>
              <span className="text-green-600">Saved: {savedCount}</span>
              {errorCount > 0 && (
                <span className="text-destructive">Errors: {errorCount}</span>
              )}
            </div>

            <div className="flex gap-3">
              {!isProcessing && (
                <>
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
                </>
              )}

              <Button
                onClick={handleProcessAll}
                disabled={isProcessing || images.length === 0}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Processing {savedCount + 1} of {images.length}...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 w-5 h-5" />
                    Process All Cards
                  </>
                )}
              </Button>
            </div>
          </div>

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
                {/* Delete Button - Only show before processing */}
                {!isProcessing && !image.saved && !image.uploading && (
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
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    )}
                    {image.error && (
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground truncate">
                    {image.file.name}
                  </p>
                  <p className="text-xs font-medium mt-1">
                    {image.uploading && "Uploading..."}
                    {image.uploaded && !image.extracting && "Uploaded"}
                    {image.extracting && "Analyzing..."}
                    {image.extracted && !image.saved && "Saving..."}
                    {image.saved && "✓ Saved"}
                    {image.error && "❌ Failed"}
                  </p>
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
    </PageContainer>
  );
}
