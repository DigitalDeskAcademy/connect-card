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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Download,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Location {
  id: string;
  name: string;
}

interface ExportClientProps {
  slug: string;
  locations: Location[];
}

type RecordFilter = "new" | "all" | "date_range";

export function ExportClient({ slug, locations }: ExportClientProps) {
  // Form state
  const [format, setFormat] = useState<DataExportFormat>("PLANNING_CENTER_CSV");
  const [locationId, setLocationId] = useState<string>("all");
  const [recordFilter, setRecordFilter] = useState<RecordFilter>("new");

  // Preview state
  const [preview, setPreview] = useState<{
    totalCount: number;
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

  // Build filters from form state
  const buildFilters = useCallback((): ExportFilters => {
    const filters: ExportFilters = {};

    if (locationId !== "all") {
      filters.locationId = locationId;
    }

    if (recordFilter === "new") {
      filters.onlyNew = true;
    }

    return filters;
  }, [locationId, recordFilter]);

  // Load preview when filters change
  useEffect(() => {
    const loadPreview = async () => {
      setPreviewLoading(true);
      setExportSuccess(false);

      const filters = buildFilters();
      const result = await getExportPreview(slug, format, filters);

      if (result.success && result.data) {
        setPreview(result.data);
      } else {
        setPreview(null);
      }

      setPreviewLoading(false);
    };

    loadPreview();
  }, [slug, format, buildFilters]);

  // Load export history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);

      const result = await getExportHistory(slug, 5);

      if (result.success && result.data) {
        setHistory(result.data.exports);
      }

      setHistoryLoading(false);
    };

    loadHistory();
  }, [slug]);

  // Handle export
  const handleExport = () => {
    startTransition(async () => {
      const filters = buildFilters();
      const result = await createExport(slug, format, filters);

      if (result.success && result.data) {
        // Trigger download
        const downloadUrl = `/api/export/download?id=${result.data.exportId}`;
        window.location.href = downloadUrl;

        setExportSuccess(true);
        toast.success(`Exported ${result.data.recordCount} records`);

        // Refresh preview and history
        const previewResult = await getExportPreview(slug, format, filters);
        if (previewResult.success && previewResult.data) {
          setPreview(previewResult.data);
        }

        const historyResult = await getExportHistory(slug, 5);
        if (historyResult.success && historyResult.data) {
          setHistory(historyResult.data.exports);
        }
      } else {
        toast.error(result.error || "Export failed");
      }
    });
  };

  // Handle re-download from history
  const handleRedownload = (exportId: string) => {
    const link = document.createElement("a");
    link.href = `/api/export/download?id=${exportId}`;
    link.click();
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
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Export Connect Cards
        </h1>
        <p className="text-muted-foreground">
          Download visitor data formatted for your church management software
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>
                Choose your export format and filter options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-3">
                <Label>Export Format</Label>
                <RadioGroup
                  value={format}
                  onValueChange={(v: string) =>
                    setFormat(v as DataExportFormat)
                  }
                  className="grid gap-3"
                >
                  {formatOptions.map(option => (
                    <div
                      key={option.value}
                      className="flex items-start space-x-3"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="mt-1"
                      />
                      <div className="grid gap-1">
                        <Label
                          htmlFor={option.value}
                          className="font-medium cursor-pointer"
                        >
                          {option.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="location">
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

              {/* Record Filter */}
              <div className="space-y-3">
                <Label>Records to Export</Label>
                <RadioGroup
                  value={recordFilter}
                  onValueChange={(v: string) =>
                    setRecordFilter(v as RecordFilter)
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="font-normal cursor-pointer">
                      Not yet exported
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="font-normal cursor-pointer">
                      All records
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Preview
                {previewLoading && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                {preview ? (
                  <>
                    {preview.totalCount} record
                    {preview.totalCount !== 1 ? "s" : ""} will be exported
                  </>
                ) : (
                  "Loading preview..."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Warnings */}
              {preview && preview.warnings.length > 0 && (
                <div className="mb-4 space-y-2">
                  {preview.warnings.map((warning, idx) => (
                    <Alert
                      key={idx}
                      variant="default"
                      className="border-yellow-200 bg-yellow-50"
                    >
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        {warning.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Preview Table */}
              {previewLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : preview && preview.sampleRows.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {preview.headers.map((header, idx) => (
                          <TableHead key={idx} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.sampleRows.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <TableCell
                              key={cellIdx}
                              className="whitespace-nowrap"
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
                <p className="text-muted-foreground text-center py-8">
                  No records match your filter criteria
                </p>
              )}

              {/* Export Button */}
              <div className="mt-6 flex items-center gap-4">
                <Button
                  onClick={handleExport}
                  disabled={isPending || !preview || preview.totalCount === 0}
                  className="gap-2"
                >
                  {isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isPending ? "Exporting..." : "Download CSV"}
                </Button>

                {exportSuccess && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Export complete
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Exports</CardTitle>
              <CardDescription>Download previous exports</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">
                            {formatLabel(item.format)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.recordCount} records •{" "}
                            {formatDistanceToNow(new Date(item.exportedAt), {
                              addSuffix: true,
                            })}
                          </p>
                          {item.fileSizeBytes && (
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(item.fileSizeBytes)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRedownload(item.id)}
                        title="Download again"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No exports yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
