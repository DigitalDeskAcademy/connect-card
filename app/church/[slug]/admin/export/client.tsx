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

type RecordFilter = "new" | "all" | "date_range";

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

  // Load export history on mount and when tab changes to history
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

  // Handle export
  const handleExport = () => {
    startTransition(async () => {
      const filters = buildFilters();
      const result = await createExport(slug, formatValue, filters);

      if (result.success && result.data) {
        // Trigger download
        const downloadUrl = `/api/export/download?id=${result.data.exportId}`;
        window.location.href = downloadUrl;

        setExportSuccess(true);
        toast.success(`Exported ${result.data.recordCount} records`);

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
          { label: "History", value: "history", count: history.length },
        ]}
      />

      {activeTab === "history" ? (
        // History Tab Content
        <div className="p-4 lg:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                Download previous exports or view export details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : history.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Format</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {formatLabel(item.format)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{item.recordCount}</TableCell>
                          <TableCell>
                            {formatBytes(item.fileSizeBytes)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(
                                  new Date(item.exportedAt),
                                  "MMM d, yyyy"
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(item.exportedAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRedownload(item.id)}
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No exports yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Export your connect cards to see them here. You can
                    re-download any previous export.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Export Tab Content
        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Export Settings */}
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
                    value={formatValue}
                    onValueChange={(v: string) =>
                      setFormatValue(v as DataExportFormat)
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
                      <Label
                        htmlFor="new"
                        className="font-normal cursor-pointer"
                      >
                        Not yet exported
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label
                        htmlFor="all"
                        className="font-normal cursor-pointer"
                      >
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
                  <div className="rounded-md border overflow-x-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {preview.headers.slice(0, 4).map((header, idx) => (
                            <TableHead key={idx} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                          {preview.headers.length > 4 && (
                            <TableHead className="text-muted-foreground">
                              +{preview.headers.length - 4} more
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.sampleRows.map((row, rowIdx) => (
                          <TableRow key={rowIdx}>
                            {row.slice(0, 4).map((cell, cellIdx) => (
                              <TableCell
                                key={cellIdx}
                                className="whitespace-nowrap"
                              >
                                {cell || (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            ))}
                            {row.length > 4 && (
                              <TableCell className="text-muted-foreground">
                                ...
                              </TableCell>
                            )}
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
        </div>
      )}
    </>
  );
}
