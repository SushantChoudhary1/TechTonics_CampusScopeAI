import type { ReportSeverity } from "./reportSeverity";

export const CAMPUS_BLOCKS = {
  A: "Academic Block 1",
  B: "Academic Block 2",
  C: "Academic Block 3",
  D: "Administrative Block",
  E: "Academic Block 4",
  F: "Academic Block 5",
} as const;

export const CAMPUS_MAP_LOCATION_IDENTIFIERS = {
  de: ["D", "E"],
  a: ["A"],
  ab1: ["AB-1"],
  ab3: ["AB-3"],
  ab4: ["AB-4"],
  ab2: ["AB-2"],
  c: ["C"],
  b: ["B"],
  f: ["F"],
  libraryAdmin: ["Library", "Administrative Block"],
} as const;

export type CampusMapLocationId = keyof typeof CAMPUS_MAP_LOCATION_IDENTIFIERS;

export function reportBelongsToCampusMapLocation(report: { block?: string | null }, locationId: CampusMapLocationId) {
  return CAMPUS_MAP_LOCATION_IDENTIFIERS[locationId].includes(report.block as never);
}

export function sortCampusMapReportsByPriority<T extends { priorityScore?: number | null; severity: ReportSeverity; createdAt?: string | Date | null }>(reports: T[]) {
  return [...reports].sort((left, right) => ((right.priorityScore ?? SEVERITY_RANK[right.severity] * 25) - (left.priorityScore ?? SEVERITY_RANK[left.severity] * 25)) || (new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()));
}

export type CampusBlock = keyof typeof CAMPUS_BLOCKS;
export type HeatMapColor = "red" | "yellow" | "green" | "blue";

export const HEAT_MAP_COLOR_BY_SEVERITY: Record<ReportSeverity, HeatMapColor> = {
  CRITICAL: "red",
  HIGH: "yellow",
  MEDIUM: "green",
  LOW: "blue",
};

const SEVERITY_RANK: Record<ReportSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export function groupReportsByBlock<T extends { block?: string | null; location?: string | null }>(reports: T[]) {
  const grouped: Record<CampusBlock, T[]> = { A: [], B: [], C: [], D: [], E: [], F: [] };
  for (const report of reports) {
    const rawBlock = report.block || report.location?.trim().split(/\s+/)[0];
    const block = rawBlock?.toUpperCase() as CampusBlock | undefined;
    if (block && block in grouped) grouped[block].push(report);
  }
  return grouped;
}

export function dominantReportSeverity(reports: Array<{ severity: ReportSeverity }>): ReportSeverity {
  return reports.reduce<ReportSeverity>((highest, report) => SEVERITY_RANK[report.severity] > SEVERITY_RANK[highest] ? report.severity : highest, "LOW");
}

export function heatMapColorForReports(reports: Array<{ severity: ReportSeverity }>): HeatMapColor {
  return HEAT_MAP_COLOR_BY_SEVERITY[dominantReportSeverity(reports)];
}

export function campusMapActivity<T extends { block?: string | null; status?: string | null; severity: ReportSeverity }>(reports: T[]) {
  return Object.fromEntries(Object.keys(CAMPUS_MAP_LOCATION_IDENTIFIERS).map((locationId) => {
    const active = reports.filter((report) => report.status?.toLowerCase() !== "resolved" && report.status?.toLowerCase() !== "completed" && reportBelongsToCampusMapLocation(report, locationId as CampusMapLocationId));
    return [locationId, { count: active.length, color: active.length ? heatMapColorForReports(active) : null }];
  })) as Record<CampusMapLocationId, { count: number; color: HeatMapColor | null }>;
}
