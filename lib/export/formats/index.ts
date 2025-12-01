import { DataExportFormat } from "@/lib/generated/prisma";
import { ExportFormat } from "../types";
import { planningCenterFormat } from "./planning-center";
import { breezeFormat } from "./breeze";
import { genericFormat } from "./generic";

/**
 * All available export formats
 */
export const exportFormats: Record<DataExportFormat, ExportFormat> = {
  PLANNING_CENTER_CSV: planningCenterFormat,
  BREEZE_CSV: breezeFormat,
  GENERIC_CSV: genericFormat,
};

/**
 * Get export format by enum value
 */
export function getExportFormat(format: DataExportFormat): ExportFormat {
  return exportFormats[format];
}

/**
 * Get all export formats as array for UI dropdown
 */
export function getExportFormatOptions(): Array<{
  value: DataExportFormat;
  label: string;
  description: string;
}> {
  return [
    {
      value: "PLANNING_CENTER_CSV",
      label: planningCenterFormat.name,
      description: planningCenterFormat.description,
    },
    {
      value: "BREEZE_CSV",
      label: breezeFormat.name,
      description: breezeFormat.description,
    },
    {
      value: "GENERIC_CSV",
      label: genericFormat.name,
      description: genericFormat.description,
    },
  ];
}

export { planningCenterFormat, breezeFormat, genericFormat };
