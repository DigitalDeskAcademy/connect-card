"use client";

/**
 * Documents Tab - Volunteer Onboarding Settings
 *
 * Manage volunteer documents library:
 * - Upload new documents (PDFs, Word docs, images)
 * - Set scope (global or ministry-specific)
 * - View usage statistics (how many times sent)
 * - Delete documents
 */

import { useState, useTransition, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  IconUpload,
  IconTrash,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconPhoto,
  IconFile,
  IconLoader2,
  IconExternalLink,
  IconFileText,
  IconBulb,
  IconPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createVolunteerDocument,
  deleteVolunteerDocument,
} from "@/actions/volunteers/onboarding";
import type {
  DocumentScope,
  VolunteerCategoryType,
} from "@/lib/generated/prisma";
import { volunteerCategoryTypes } from "@/lib/zodSchemas";

// Document data type matching API response
interface DocumentData {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  scope: DocumentScope;
  category: VolunteerCategoryType | null;
  description: string | null;
  uploadedAt: Date;
  deliveryCount: number;
}

interface DocumentsTabProps {
  slug: string;
  organizationId: string;
  documents: DocumentData[];
}

// File type icons
function getFileIcon(mimeType: string) {
  if (mimeType === "application/pdf") {
    return <IconFileTypePdf className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <IconFileTypeDoc className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType.startsWith("image/")) {
    return <IconPhoto className="h-5 w-5 text-green-500" />;
  }
  return <IconFile className="h-5 w-5 text-muted-foreground" />;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format category name for display
function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Suggested document templates for churches
interface SuggestedTemplate {
  id: string;
  name: string;
  description: string;
  scope: "GLOBAL" | "MINISTRY_SPECIFIC";
  category?: string; // Only for MINISTRY_SPECIFIC
  priority: "essential" | "recommended" | "optional";
}

const suggestedTemplates: SuggestedTemplate[] = [
  // Essential documents for all volunteers
  {
    id: "volunteer-handbook",
    name: "Volunteer Handbook",
    description:
      "Overview of church mission, volunteer expectations, policies, and procedures",
    scope: "GLOBAL",
    priority: "essential",
  },
  {
    id: "code-of-conduct",
    name: "Code of Conduct",
    description:
      "Behavioral expectations, dress code, and professional standards for all volunteers",
    scope: "GLOBAL",
    priority: "essential",
  },
  {
    id: "media-release",
    name: "Media Release Form",
    description:
      "Permission to use volunteer photos/videos in church communications",
    scope: "GLOBAL",
    priority: "recommended",
  },
  {
    id: "confidentiality-agreement",
    name: "Confidentiality Agreement",
    description: "Protection of member information and church data",
    scope: "GLOBAL",
    priority: "recommended",
  },
  // Kids Ministry specific
  {
    id: "child-safety-policy",
    name: "Child Safety Policy",
    description:
      "Comprehensive child protection guidelines, reporting procedures, and safety protocols",
    scope: "MINISTRY_SPECIFIC",
    category: "KIDS_MINISTRY",
    priority: "essential",
  },
  {
    id: "kids-bathroom-policy",
    name: "Bathroom & Diaper Policy",
    description:
      "Guidelines for bathroom breaks and diaper changes with proper supervision",
    scope: "MINISTRY_SPECIFIC",
    category: "KIDS_MINISTRY",
    priority: "essential",
  },
  {
    id: "kids-check-in-procedures",
    name: "Check-in/Check-out Procedures",
    description:
      "Secure child pick-up and drop-off protocols using security codes",
    scope: "MINISTRY_SPECIFIC",
    category: "KIDS_MINISTRY",
    priority: "recommended",
  },
  {
    id: "kids-allergy-protocol",
    name: "Allergy & Medical Protocol",
    description: "Handling food allergies, medication, and medical emergencies",
    scope: "MINISTRY_SPECIFIC",
    category: "KIDS_MINISTRY",
    priority: "recommended",
  },
  // Worship Team specific
  {
    id: "worship-scheduling",
    name: "Worship Team Guidelines",
    description:
      "Rehearsal expectations, scheduling policies, and team commitments",
    scope: "MINISTRY_SPECIFIC",
    category: "WORSHIP_TEAM",
    priority: "recommended",
  },
  // AV Tech specific
  {
    id: "av-equipment-guide",
    name: "Equipment Operation Guide",
    description:
      "How to operate sound, lighting, and streaming equipment safely",
    scope: "MINISTRY_SPECIFIC",
    category: "AV_TECH",
    priority: "recommended",
  },
];

// Priority badge styling
function getPriorityBadge(priority: SuggestedTemplate["priority"]) {
  switch (priority) {
    case "essential":
      return <Badge variant="destructive">Essential</Badge>;
    case "recommended":
      return <Badge variant="secondary">Recommended</Badge>;
    case "optional":
      return <Badge variant="outline">Optional</Badge>;
  }
}

export function DocumentsTab({
  slug,
  // TODO: Remove ESLint disable before prod - organizationId needed for planned features (see volunteer/vision.md)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  organizationId,
  documents: initialDocuments,
}: DocumentsTabProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Upload configuration state
  const [uploadScope, setUploadScope] = useState<
    "GLOBAL" | "MINISTRY_SPECIFIC"
  >("GLOBAL");
  const [uploadCategory, setUploadCategory] = useState<string | null>(null);

  // Handle file upload
  const uploadFile = useCallback(
    async (file: File) => {
      setUploadingFile(file.name);
      setUploadProgress(0);

      try {
        // 1. Get presigned URL from our API
        const presignedResponse = await fetch("/api/s3/volunteer-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
            organizationSlug: slug,
            scope: uploadScope === "MINISTRY_SPECIFIC" ? "ministry" : "global",
            category: uploadCategory,
          }),
        });

        if (!presignedResponse.ok) {
          const error = await presignedResponse.json();
          throw new Error(error.error || "Failed to get upload URL");
        }

        const { presignedUrl, fileUrl } = await presignedResponse.json();

        // 2. Upload file directly to S3
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = event => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 204) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));

          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        // 3. Save document record in database
        startTransition(async () => {
          const result = await createVolunteerDocument(slug, {
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for display name
            fileName: file.name,
            fileUrl,
            fileSize: file.size,
            mimeType: file.type,
            scope: uploadScope,
            category:
              uploadScope === "MINISTRY_SPECIFIC" && uploadCategory
                ? (uploadCategory as (typeof volunteerCategoryTypes)[number])
                : undefined,
          });

          if (result.status === "success" && result.data) {
            // Add to local state with the new document info
            const newDocument: DocumentData = {
              id: result.data.documentId,
              name: file.name.replace(/\.[^/.]+$/, ""),
              fileName: file.name,
              fileUrl,
              fileSize: file.size,
              mimeType: file.type,
              scope: uploadScope,
              category:
                uploadScope === "MINISTRY_SPECIFIC" && uploadCategory
                  ? (uploadCategory as VolunteerCategoryType)
                  : null,
              description: null,
              uploadedAt: new Date(),
              deliveryCount: 0,
            };
            setDocuments(prev => [newDocument, ...prev]);
            toast.success("Document uploaded successfully");
          } else {
            toast.error(result.message || "Failed to save document");
          }
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploadingFile(null);
        setUploadProgress(null);
      }
    },
    [slug, uploadScope, uploadCategory]
  );

  // Dropzone configuration
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles[0]);
      }
    },
    [uploadFile]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (rejection?.errors[0]?.code === "file-too-large") {
      toast.error("File is too large. Maximum size is 10MB.");
    } else if (rejection?.errors[0]?.code === "file-invalid-type") {
      toast.error("Invalid file type. Allowed: PDF, Word, JPEG, PNG");
    } else {
      toast.error("File rejected");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isPending || uploadingFile !== null,
  });

  // Handle document deletion
  const handleDelete = (documentId: string) => {
    startTransition(async () => {
      const result = await deleteVolunteerDocument(slug, documentId);

      if (result.status === "success") {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        toast.success("Document deleted");
      } else {
        toast.error(result.message || "Failed to delete document");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card id="upload-section">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload documents to share with volunteers during onboarding
            (policies, forms, training materials).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Configuration */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Document Scope
              </label>
              <Select
                value={uploadScope}
                onValueChange={value => {
                  setUploadScope(value as "GLOBAL" | "MINISTRY_SPECIFIC");
                  if (value === "GLOBAL") setUploadCategory(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">All Volunteers</SelectItem>
                  <SelectItem value="MINISTRY_SPECIFIC">
                    Ministry-Specific
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadScope === "MINISTRY_SPECIFIC" && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Ministry
                </label>
                <Select
                  value={uploadCategory || ""}
                  onValueChange={setUploadCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ministry" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteerCategoryTypes.map(category => (
                      <SelectItem key={category} value={category}>
                        {formatCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              (isPending || uploadingFile) && "pointer-events-none opacity-50"
            )}
          >
            <input {...getInputProps()} />
            {uploadingFile ? (
              <div className="space-y-3">
                <IconLoader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <p className="text-sm font-medium">
                  Uploading {uploadingFile}...
                </p>
                {uploadProgress !== null && (
                  <Progress
                    value={uploadProgress}
                    className="max-w-xs mx-auto"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <IconUpload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? "Drop the file here..."
                    : "Drag and drop a file, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, JPEG, PNG (max 10MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
            available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconFileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.mimeType)}
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.scope === "GLOBAL" ? (
                        <Badge variant="secondary">All Volunteers</Badge>
                      ) : (
                        <Badge variant="outline">
                          {doc.category
                            ? formatCategoryLabel(doc.category)
                            : "Ministry"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.deliveryCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={isPending}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{doc.name}
                                &quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Suggested Templates Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBulb className="h-5 w-5 text-amber-500" />
            <CardTitle>Suggested Templates</CardTitle>
          </div>
          <CardDescription>
            Recommended documents for volunteer onboarding. Use these as a guide
            for what to upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Global Documents */}
            <AccordionItem value="global">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">For All Volunteers</span>
                  <Badge variant="outline" className="text-xs">
                    {
                      suggestedTemplates.filter(t => t.scope === "GLOBAL")
                        .length
                    }{" "}
                    documents
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {suggestedTemplates
                    .filter(t => t.scope === "GLOBAL")
                    .map(template => {
                      const hasDocument = documents.some(
                        doc =>
                          doc.name
                            .toLowerCase()
                            .includes(
                              template.name.toLowerCase().split(" ")[0]
                            ) ||
                          template.name
                            .toLowerCase()
                            .includes(doc.name.toLowerCase().split(" ")[0])
                      );
                      return (
                        <div
                          key={template.id}
                          className={cn(
                            "flex items-start justify-between gap-4 p-3 rounded-lg border",
                            hasDocument && "bg-muted/50"
                          )}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {template.name}
                              </span>
                              {getPriorityBadge(template.priority)}
                              {hasDocument && (
                                <Badge
                                  variant="default"
                                  className="text-xs bg-green-600"
                                >
                                  Uploaded
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                          {!hasDocument && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUploadScope("GLOBAL");
                                setUploadCategory(null);
                                // Scroll to upload section
                                document
                                  .getElementById("upload-section")
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                  });
                              }}
                            >
                              <IconPlus className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ministry-Specific Documents */}
            {volunteerCategoryTypes
              .filter(cat =>
                suggestedTemplates.some(
                  t => t.scope === "MINISTRY_SPECIFIC" && t.category === cat
                )
              )
              .map(category => {
                const categoryTemplates = suggestedTemplates.filter(
                  t =>
                    t.scope === "MINISTRY_SPECIFIC" && t.category === category
                );
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCategoryLabel(category)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {categoryTemplates.length} documents
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {categoryTemplates.map(template => {
                          const hasDocument = documents.some(
                            doc =>
                              doc.category === category &&
                              (doc.name
                                .toLowerCase()
                                .includes(
                                  template.name.toLowerCase().split(" ")[0]
                                ) ||
                                template.name
                                  .toLowerCase()
                                  .includes(
                                    doc.name.toLowerCase().split(" ")[0]
                                  ))
                          );
                          return (
                            <div
                              key={template.id}
                              className={cn(
                                "flex items-start justify-between gap-4 p-3 rounded-lg border",
                                hasDocument && "bg-muted/50"
                              )}
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {template.name}
                                  </span>
                                  {getPriorityBadge(template.priority)}
                                  {hasDocument && (
                                    <Badge
                                      variant="default"
                                      className="text-xs bg-green-600"
                                    >
                                      Uploaded
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {template.description}
                                </p>
                              </div>
                              {!hasDocument && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setUploadScope("MINISTRY_SPECIFIC");
                                    setUploadCategory(category);
                                    // Scroll to upload section
                                    document
                                      .getElementById("upload-section")
                                      ?.scrollIntoView({
                                        behavior: "smooth",
                                      });
                                  }}
                                >
                                  <IconPlus className="h-4 w-4 mr-1" />
                                  Upload
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
