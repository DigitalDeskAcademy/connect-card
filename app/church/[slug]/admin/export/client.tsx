"use client";

import {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import { DataExportFormat } from "@/lib/generated/prisma";
import { getExportFormatOptions, getFormatFields } from "@/lib/export";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, PreviewTable } from "@/components/data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Clock,
  Users,
  Info,
  ChevronDown,
  Settings2,
  History,
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

  // Field selection state - derive availableFields from format
  const availableFields = useMemo(
    () => getFormatFields(formatValue),
    [formatValue]
  );
  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    getFormatFields("PLANNING_CENTER_CSV")
  );
  const [fieldsOpen, setFieldsOpen] = useState(false);

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

  // Handle format change - updates format and resets field selection together
  const handleFormatChange = useCallback((newFormat: DataExportFormat) => {
    setFormatValue(newFormat);
    setSelectedFields(getFormatFields(newFormat));
  }, []);

  // Build filters from form state - always sync-focused (only new records)
  const buildFilters = useCallback((): ExportFilters => {
    const filters: ExportFilters = {
      onlyNew: true, // Always show only unsynced records
    };

    if (locationId !== "all") {
      filters.locationId = locationId;
    }

    // Only include selectedFields if not all fields are selected
    if (selectedFields.length < availableFields.length) {
      filters.selectedFields = selectedFields;
    }

    return filters;
  }, [locationId, selectedFields, availableFields.length]);

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

  // Field selection helpers
  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(availableFields);
  };

  const deselectAllFields = () => {
    // Keep at least one field selected (first one)
    setSelectedFields([availableFields[0]]);
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

  // Column definitions for export history table
  const historyColumns: ColumnDef<ExportHistoryItem>[] = useMemo(
    () => [
      {
        accessorKey: "format",
        header: "Format",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {formatLabel(row.original.format)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "recordCount",
        header: "Records",
      },
      {
        accessorKey: "fileSizeBytes",
        header: "Size",
        cell: ({ row }) => formatBytes(row.original.fileSizeBytes),
      },
      {
        accessorKey: "exportedAt",
        header: "Date",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm">
              {format(new Date(row.original.exportedAt), "MMM d, yyyy")}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(row.original.exportedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              handleRedownload(row.original.id, row.original.fileName)
            }
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        ),
        meta: {
          className: "w-[100px]",
        },
      },
    ],
    [handleRedownload]
  );

  return (
    <>
      <NavTabs
        baseUrl={`/church/${slug}/admin/export`}
        tabs={[
          { label: "Export", value: "export", icon: Download },
          { label: "History", value: "history", icon: History },
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
            ) : (
              <DataTable
                columns={historyColumns}
                data={history}
                variant="compact"
                wrapInCard={false}
                emptyState={{
                  icon: <FileSpreadsheet className="h-8 w-8" />,
                  title: "No exports yet",
                  description:
                    "Export your connect cards to see them here. You can re-download any previous export.",
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        // Export Tab Content - Sync-focused UI
        <div className="space-y-4">
          {/* Sync Status Summary */}
          <div className="grid grid-cols-2 gap-4">
            {/* Ready to Sync - Primary action, on left */}
            <Card className="bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    {previewLoading ? (
                      <Skeleton className="h-7 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-primary">
                        {preview?.uniqueCount ?? 0}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      record{(preview?.uniqueCount ?? 0) !== 1 ? "s" : ""} to
                      export
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Synced */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-muted rounded-lg shrink-0">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    {historyLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : history.length > 0 ? (
                      <>
                        <p className="text-lg font-semibold truncate">
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
                      <>
                        <p className="text-lg font-semibold text-muted-foreground">
                          Never
                        </p>
                        <p className="text-xs text-muted-foreground">
                          last synced
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                      handleFormatChange(v as DataExportFormat)
                    }
                  >
                    <SelectTrigger className="min-w-[180px] w-auto shrink-0">
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
                      <SelectTrigger className="min-w-[180px] w-auto shrink-0">
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

            <CardContent className="flex flex-col flex-1 min-h-0 space-y-4">
              {/* Field Selection & Status Badges Row */}
              <Collapsible open={fieldsOpen} onOpenChange={setFieldsOpen}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      Customize Fields
                      {selectedFields.length < availableFields.length && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedFields.length}/{availableFields.length}
                        </Badge>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${fieldsOpen ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {previewLoading ? (
                      <Skeleton className="h-6 w-24" />
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
                </div>
                <CollapsibleContent className="pt-3">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Select which fields to include in the export
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllFields}
                          disabled={
                            selectedFields.length === availableFields.length
                          }
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={deselectAllFields}
                          disabled={selectedFields.length === 1}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {availableFields.map(field => (
                        <label
                          key={field}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedFields.includes(field)}
                            onCheckedChange={() => toggleField(field)}
                            disabled={
                              selectedFields.length === 1 &&
                              selectedFields.includes(field)
                            }
                          />
                          <span className="text-sm">{field}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Preview Table */}
              {previewLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <PreviewTable
                  headers={preview?.headers ?? []}
                  rows={preview?.sampleRows ?? []}
                  totalCount={preview?.uniqueCount ?? 0}
                  maxRows={10}
                  maxHeight="400px"
                  emptyState={{
                    icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
                    title: "All caught up!",
                    description:
                      "No new connect cards to export. All records have been synced to your ChMS.",
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
