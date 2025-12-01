"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { DataExportFormat } from "@/lib/generated/prisma";
import { getExportFormatOptions } from "@/lib/export";
import {
  createExport,
  getExportPreview,
  getExportHistory,
  type ExportHistoryItem,
} from "@/actions/export";
import { ExportFilters, ExportWarning } from "@/lib/export/types";
import { NavTabs } from "@/components/layout/nav-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Clock,
  Users,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface Location {
  id: string;
  name: string;
}

interface ExportClientProps {
  slug: string;
  locations: Location[];
  activeTab: string;
}

export function ExportClient({
  slug,
  locations,
  activeTab,
}: ExportClientProps) {
  // Form state
  const [formatValue, setFormatValue] = useState<DataExportFormat>(
    "PLANNING_CENTER_CSV"
  );
  const [locationId, setLocationId] = useState<string>("all");

  // Preview state
  const [preview, setPreview] = useState<{
    totalCount: number;
    uniqueCount: number;
    duplicatesSkipped: number;
    headers: string[];
    sampleRows: string[][];
    warnings: ExportWarning[];
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  // Export history state
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Action state
  const [isPending, startTransition] = useTransition();
  const [exportSuccess, setExportSuccess] = useState(false);

  const formatOptions = getExportFormatOptions();

  // Build filters from form state - always sync-focused (only new records)
  const buildFilters = useCallback((): ExportFilters => {
    const filters: ExportFilters = {
      onlyNew: true, // Always show only unsynced records
    };

    if (locationId !== "all") {
      filters.locationId = locationId;
    }

    return filters;
  }, [locationId]);

  // Load preview when filters change
  useEffect(() => {
    const loadPreview = async () => {
      setPreviewLoading(true);
      setExportSuccess(false);

      const filters = buildFilters();
      const result = await getExportPreview(slug, formatValue, filters);

      if (result.success && result.data) {
        setPreview(result.data);
      } else {
        setPreview(null);
      }

      setPreviewLoading(false);
    };

    loadPreview();
  }, [slug, formatValue, buildFilters]);

  // Load export history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);

      const result = await getExportHistory(slug, 20);

      if (result.success && result.data) {
        setHistory(result.data.exports);
      }

      setHistoryLoading(false);
    };

    loadHistory();
  }, [slug]);

  // Trigger file download via programmatic anchor click (React Compiler safe)
  const triggerDownload = (url: string, filename?: string) => {
    const link = document.createElement("a");
    link.href = url;
    if (filename) link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle export
  const handleExport = () => {
    startTransition(async () => {
      const filters = buildFilters();
      const result = await createExport(slug, formatValue, filters);

      if (result.success && result.data) {
        // Trigger download via anchor click (no page navigation)
        triggerDownload(
          `/api/export/download?id=${result.data.exportId}`,
          result.data.fileName
        );

        setExportSuccess(true);
        toast.success(`Exported ${result.data.uniqueCount} records`);

        // Refresh preview and history
        const previewResult = await getExportPreview(
          slug,
          formatValue,
          filters
        );
        if (previewResult.success && previewResult.data) {
          setPreview(previewResult.data);
        }

        const historyResult = await getExportHistory(slug, 20);
        if (historyResult.success && historyResult.data) {
          setHistory(historyResult.data.exports);
        }
      } else {
        toast.error(result.error || "Export failed");
      }
    });
  };

  // Handle re-download from history
  const handleRedownload = (exportId: string, fileName?: string) => {
    triggerDownload(`/api/export/download?id=${exportId}`, fileName);
  };

  const formatLabel = (f: DataExportFormat) => {
    switch (f) {
      case "PLANNING_CENTER_CSV":
        return "Planning Center";
      case "BREEZE_CSV":
        return "Breeze";
      case "GENERIC_CSV":
        return "Generic CSV";
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <NavTabs
        baseUrl={`/church/${slug}/admin/export`}
        tabs={[
          { label: "Export", value: "export" },
          { label: "History", value: "history" },
        ]}
      />

      {activeTab === "history" ? (
        // History Tab Content
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Export History</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0">
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : history.length > 0 ? (
              <div className="rounded-md border flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 border-r last:border-r-0 border-border">
                        Format
                      </TableHead>
                      <TableHead className="px-4 border-r last:border-r-0 border-border">
                        Records
                      </TableHead>
                      <TableHead className="px-4 border-r last:border-r-0 border-border">
                        Size
                      </TableHead>
                      <TableHead className="px-4 border-r last:border-r-0 border-border">
                        Date
                      </TableHead>
                      <TableHead className="px-4 border-r last:border-r-0 border-border w-[100px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:last-child]:border-b">
                    {history.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 border-r last:border-r-0 border-border">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatLabel(item.format)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 border-r last:border-r-0 border-border">
                          {item.recordCount}
                        </TableCell>
                        <TableCell className="px-4 border-r last:border-r-0 border-border">
                          {formatBytes(item.fileSizeBytes)}
                        </TableCell>
                        <TableCell className="px-4 border-r last:border-r-0 border-border">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {format(new Date(item.exportedAt), "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.exportedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 border-r last:border-r-0 border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRedownload(item.id, item.fileName)
                            }
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileSpreadsheet className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>No exports yet</EmptyTitle>
                  <EmptyDescription>
                    Export your connect cards to see them here. You can
                    re-download any previous export.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      ) : (
        // Export Tab Content - Sync-focused UI
        <div className="space-y-4">
          {/* Sync Status Summary Card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                {/* Last Synced */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Last Synced
                    </p>
                    {historyLoading ? (
                      <Skeleton className="h-6 w-24 mt-1" />
                    ) : history.length > 0 ? (
                      <>
                        <p className="text-lg font-semibold">
                          {formatDistanceToNow(
                            new Date(history[0].exportedAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(history[0].exportedAt),
                            "MMM d, h:mm a"
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-semibold text-muted-foreground">
                        Never
                      </p>
                    )}
                  </div>
                </div>

                {/* Pending Count */}
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                      Ready to Sync
                    </p>
                    {previewLoading ? (
                      <Skeleton className="h-8 w-16 mt-1 ml-auto" />
                    ) : (
                      <p className="text-3xl font-bold text-primary text-right">
                        {preview?.uniqueCount ?? 0}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground text-right">
                      new visitor{(preview?.uniqueCount ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Settings & Preview */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-shrink-0 space-y-4">
              {/* Title and Download Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Export to ChMS</CardTitle>
                  {exportSuccess && (
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Exported
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={handleExport}
                  disabled={isPending || !preview || preview.uniqueCount === 0}
                  className="gap-2"
                >
                  {isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isPending ? "Exporting..." : "Download CSV"}
                </Button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-end gap-4">
                {/* Format Selection */}
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={formatValue}
                    onValueChange={(v: string) =>
                      setFormatValue(v as DataExportFormat)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                {locations.length > 1 && (
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={locationId} onValueChange={setLocationId}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {previewLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : preview ? (
                  <>
                    <Badge variant="default">
                      {preview.uniqueCount} record
                      {preview.uniqueCount !== 1 ? "s" : ""} ready
                    </Badge>
                    {preview.duplicatesSkipped > 0 && (
                      <Badge variant="secondary">
                        {preview.duplicatesSkipped} duplicate
                        {preview.duplicatesSkipped !== 1 ? "s" : ""} merged
                      </Badge>
                    )}
                  </>
                ) : null}
              </div>

              {/* ChMS-specific tip */}
              {formatValue === "PLANNING_CENTER_CSV" && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Planning Center matches contacts by email. If you import the
                    same email twice, it will update the existing contact.
                  </AlertDescription>
                </Alert>
              )}
              {formatValue === "BREEZE_CSV" && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Breeze uses email to match existing people. New emails
                    create new profiles automatically.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>

            <CardContent className="flex flex-col flex-1 min-h-0">
              {/* Preview Table */}
              {previewLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : preview && preview.uniqueCount > 0 ? (
                <div className="rounded-md border flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {preview.headers.map((header, idx) => (
                          <TableHead
                            key={idx}
                            className="px-4 border-r last:border-r-0 border-border whitespace-nowrap"
                          >
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:last-child]:border-b">
                      {preview.sampleRows.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <TableCell
                              key={cellIdx}
                              className="px-4 border-r last:border-r-0 border-border whitespace-nowrap"
                            >
                              {cell || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </EmptyMedia>
                    <EmptyTitle>All caught up!</EmptyTitle>
                    <EmptyDescription>
                      No new connect cards to export. All visitors have been
                      synced to your ChMS.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
