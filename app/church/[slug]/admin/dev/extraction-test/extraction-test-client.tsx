"use client";

/**
 * Extraction Test - Simple Two-Column Layout
 *
 * Left: Upload (1-2 images)
 * Right: JSON output
 *
 * Supports single and two-sided cards using same API as production.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconUpload,
  IconLoader2,
  IconTrash,
  IconRotate,
} from "@tabler/icons-react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Layers,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { fileToBase64 } from "@/lib/utils/extraction";

interface ExtractionTestClientProps {
  slug: string;
}

interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request: string | null;
  visit_status: string | null;
  first_time_visitor: boolean | null;
  interests: string[] | null;
  keywords: string[] | null;
  address: string | null;
  age_group: string | null;
  family_info: string | null;
  additional_notes: string | null;
}

interface UploadedImage {
  file: File;
  preview: string;
  side: "front" | "back";
}

export function ExtractionTestClient({ slug }: ExtractionTestClientProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    maxFiles: 2,
    onDrop: acceptedFiles => {
      // Clear previous state
      setExtractedData(null);
      setRawResponse(null);
      setError(null);

      // Take first 2 files
      const files = acceptedFiles.slice(0, 2);
      const newImages: UploadedImage[] = files.map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        side: i === 0 ? "front" : "back",
      }));

      setImages(newImages);

      if (newImages.length === 2) {
        toast.success("Two images - will extract as front + back");
      }
    },
  });

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      // Reassign sides
      return updated.map((img, i) => ({
        ...img,
        side: i === 0 ? "front" : "back",
      }));
    });
    setExtractedData(null);
    setError(null);
  };

  const swapImages = () => {
    if (images.length !== 2) return;
    setImages([
      { ...images[1], side: "front" },
      { ...images[0], side: "back" },
    ]);
    toast.info("Swapped front/back");
  };

  const handleExtract = async () => {
    if (images.length === 0) {
      setError("Upload an image first");
      return;
    }

    setExtracting(true);
    setError(null);
    setExtractedData(null);
    setRawResponse(null);

    try {
      const frontImage = images.find(img => img.side === "front");
      const backImage = images.find(img => img.side === "back");

      if (!frontImage) {
        throw new Error("No front image");
      }

      const frontBase64 = await fileToBase64(frontImage.file);
      const backBase64 = backImage ? await fileToBase64(backImage.file) : null;

      // Build request - same format as production
      const body: Record<string, string> = { organizationSlug: slug };

      if (backBase64 && backImage) {
        body.frontImageData = frontBase64;
        body.frontMediaType = frontImage.file.type;
        body.backImageData = backBase64;
        body.backMediaType = backImage.file.type;
      } else {
        body.imageData = frontBase64;
        body.mediaType = frontImage.file.type;
      }

      const response = await fetch("/api/connect-cards/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 && result.duplicate) {
          throw new Error(`Duplicate: ${result.message}`);
        }
        throw new Error(result.error || "Extraction failed");
      }

      setExtractedData(result.data);
      setRawResponse(result.raw_text || null);
      toast.success(
        backImage ? "Two-sided extraction complete" : "Extraction complete"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setExtracting(false);
    }
  };

  const reset = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setExtractedData(null);
    setRawResponse(null);
    setError(null);
  };

  const isTwoSided = images.length === 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
      {/* LEFT: Upload */}
      <Card className="flex flex-col">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Upload Connect Card
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden pt-0">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <IconUpload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop here..." : "Drop 1-2 images"}
            </p>
            <p className="text-xs text-muted-foreground">
              1 = single-sided • 2 = front + back
            </p>
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isTwoSided ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary">
                      <Layers className="h-3 w-3" /> Two-sided
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      <Square className="h-3 w-3" /> Single
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isTwoSided && (
                    <Button variant="outline" size="sm" onClick={swapImages}>
                      <IconRotate className="h-3 w-3 mr-1" />
                      Swap
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={reset}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <div className="aspect-[3/2] rounded border overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt={img.side}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded uppercase font-medium">
                      {img.side}
                    </span>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeImage(i)}
                    >
                      <IconTrash className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {/* Add back placeholder */}
                {images.length === 1 && (
                  <div
                    {...getRootProps()}
                    className="aspect-[3/2] rounded border-2 border-dashed flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/50"
                  >
                    <div className="text-center">
                      <IconUpload className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-sm">Drop back image here</p>
                      <p className="text-xs">(optional)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extract button */}
          {images.length > 0 && (
            <Button
              onClick={handleExtract}
              disabled={extracting}
              size="lg"
              className="w-full"
            >
              {extracting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Extract {isTwoSided ? "Both Sides" : "Data"}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* RIGHT: Results */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Extracted Data</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {/* Empty state */}
          {!extractedData && !error && !extracting && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Upload and extract to see results</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {extracting && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <IconLoader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Extracting data...
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success banner - sticky */}
          {extractedData && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 sticky top-0 z-10">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Extracted successfully! {isTwoSided && "(two-sided)"}
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {extractedData && (
            <div className="space-y-4 mt-4">
              {/* Extracted fields */}
              <details open>
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  View extracted fields
                </summary>
                <div className="space-y-2 mt-2">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div
                      key={key}
                      className="border-l-2 border-primary pl-3 py-1"
                    >
                      <div className="text-xs font-medium text-muted-foreground uppercase">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm font-mono">
                        {value === null ? (
                          <span className="text-muted-foreground italic">
                            null
                          </span>
                        ) : Array.isArray(value) ? (
                          value.length > 0 ? (
                            value.join(", ")
                          ) : (
                            <span className="text-muted-foreground italic">
                              []
                            </span>
                          )
                        ) : typeof value === "boolean" ? (
                          value ? (
                            "true"
                          ) : (
                            "false"
                          )
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              {/* Raw JSON */}
              <details className="mt-2">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  View raw JSON
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-[200px] font-mono">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </details>

              {/* Raw API response */}
              {rawResponse && (
                <details className="mt-2">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    View raw API response
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-[200px] font-mono whitespace-pre-wrap">
                    {rawResponse}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Test Another - pushed to bottom */}
          {extractedData && (
            <div className="mt-auto pt-4">
              <Button variant="outline" className="w-full" onClick={reset}>
                Test Another Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
