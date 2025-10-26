"use client";

import { useState } from "react";
import { Uploader } from "@/components/file-uploader/Uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

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
  additional_notes: string | null;
}

export default function ConnectCardTestPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [imageKey, setImageKey] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!imageKey) {
      setError("Please upload an image first");
      return;
    }

    setExtracting(true);
    setError(null);
    setExtractedData(null);

    try {
      // Construct full S3 URL from key
      const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
      const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageKey}`;

      console.log("📤 Sending image to vision API:", imageUrl);

      const response = await fetch("/api/connect-cards/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract data");
      }

      const result = await response.json();

      console.log("✅ Extraction complete:", result);

      setExtractedData(result.data);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 h-full">
      {/* Upload Section - Full Width */}
      <Card className="relative flex-shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Connect Card
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {imageKey ? (
            <>
              {/* Close button - top right of card */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 z-20 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  setImageKey(null);
                  setExtractedData(null);
                  setError(null);
                }}
                title="Close upload session"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="grid grid-cols-2 gap-6">
                {/* Image preview on left */}
                <div className="col-span-1">
                  <Uploader
                    value={imageKey || ""}
                    onChange={key => {
                      setImageKey(key);
                      setExtractedData(null);
                      setError(null);
                      if (key) {
                        toast.success("Image uploaded successfully!");
                      }
                    }}
                    fileTypeAccepted="image"
                    fileType="asset"
                    organizationSlug={slug}
                    showSuccessToast={false}
                  />
                </div>

                {/* Buttons on right - inside the border */}
                <div className="col-span-1 flex flex-col gap-3 justify-center">
                  <Button
                    onClick={handleExtract}
                    disabled={extracting}
                    className="w-full"
                    size="lg"
                  >
                    {extracting ? (
                      <>
                        <Spinner className="mr-2" />
                        Analyzing with Claude...
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
                    onClick={() => {
                      setImageKey(null);
                      setExtractedData(null);
                      setError(null);
                    }}
                    className="w-full"
                    size="lg"
                  >
                    <ImageIcon className="mr-2 w-5 h-5" />
                    Change Image
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Uploader
              value={imageKey || ""}
              onChange={key => {
                setImageKey(key);
                setExtractedData(null);
                setError(null);
                if (key) {
                  toast.success("Image uploaded successfully!");
                }
              }}
              fileTypeAccepted="image"
              fileType="asset"
              organizationSlug={slug}
              showSuccessToast={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Results Section - Fills Remaining Space */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Extracted Data</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {!extractedData && !error && !extracting && (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Upload and extract to see results</p>
              </div>
            </div>
          )}

          {extracting && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Spinner className="w-12 h-12 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Claude is analyzing your connect card...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take 3-5 seconds
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {extractedData && (
            <div className="space-y-4">
              {/* Success message */}
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully extracted data!
                </AlertDescription>
              </Alert>

              {/* Data fields */}
              <div className="space-y-3">
                {Object.entries(extractedData).map(([key, value]) => (
                  <div
                    key={key}
                    className="border-l-2 border-blue-500 pl-3 py-1"
                  >
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm font-mono">
                      {value === null ? (
                        <span className="text-muted-foreground italic">
                          not found
                        </span>
                      ) : Array.isArray(value) ? (
                        <span>{value.join(", ")}</span>
                      ) : typeof value === "boolean" ? (
                        <span>{value ? "Yes" : "No"}</span>
                      ) : (
                        <span>{String(value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw JSON (for debugging) */}
              <details className="mt-6">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  View raw JSON
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
