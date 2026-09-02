import { describe, expect, it } from "vitest";
import { assertEmployeeCanBeRemoved, notificationReadPatch } from "./db";
import { buildAssignmentNotificationMessage, buildFeedbackNotificationMessage, buildResolutionNotificationMessage, createMeaningPreservingTranslationMessages, decodeAdminProfileImage, decodeEvidenceImage, isActiveReportStatus } from "./routers";
import { classifyReportSeverity } from "../shared/reportSeverity";
import { CAMPUS_MAP_LOCATION_IDENTIFIERS, campusMapActivity, dominantReportSeverity, groupReportsByBlock, heatMapColorForReports, reportBelongsToCampusMapLocation, sortCampusMapReportsByPriority } from "../shared/mapHeat";
import { buildReportTrendSeries } from "../shared/reportAnalytics";
import { buildOverviewMetrics } from "../shared/overviewMetrics";

const onePixelPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("complaint evidence workflow", () => {
  it("accepts small supported image data URLs for complaint evidence", () => {
    const image = decodeEvidenceImage(onePixelPng);
    expect(image.mimeType).toBe("image/png");
    expect(image.extension).toBe("png");
    expect(image.buffer.length).toBeGreaterThan(0);
  });

  it("rejects non-image evidence instead of storing unsafe content", () => {
    expect(() => decodeEvidenceImage("data:text/plain;base64,SGVsbG8=" as string)).toThrow("Evidence must be a PNG, JPEG, or WebP image.");
  });

  it("keeps admin profile image validation aligned with evidence validation", () => {
    const image = decodeAdminProfileImage(onePixelPng, "image/png");
    expect(image.mimeType).toBe("image/png");
    expect(image.extension).toBe("png");
  });

  it("blocks deleting a faculty member who still owns active work", () => {
    expect(() => assertEmployeeCanBeRemoved(1)).toThrow("employee is managing a complaint");
    expect(() => assertEmployeeCanBeRemoved(0)).not.toThrow();
  });
});

describe("complaint workflow contracts", () => {
  it("keeps completed complaints out of active work while retaining them for logged history", () => {
    expect(isActiveReportStatus("submitted")).toBe(true);
    expect(isActiveReportStatus("assigned")).toBe(true);
    expect(isActiveReportStatus("in_progress")).toBe(true);
    expect(isActiveReportStatus("completed")).toBe(false);
  });

  it("preserves named complaint context in assignment and resolution notifications", () => {
    const assigned = buildAssignmentNotificationMessage("Admin Desk", "Arvind Rao", 2039, "Low water pressure", "B", "Second floor");
    const resolved = buildResolutionNotificationMessage("Admin Desk", "Arvind Rao", 2039, "Low water pressure", "B");
    expect(assigned).toContain("Admin Desk");
    expect(assigned).toContain("Arvind Rao");
    expect(assigned).toContain("#2039");
    expect(assigned).toContain("Low water pressure");
    expect(resolved).toContain("resolved complaint #2039");
    expect(resolved).toContain("after work by Arvind Rao");
  });

  it("includes complaint number and a bounded feedback summary for admins", () => {
    const message = buildFeedbackNotificationMessage("Ananya", "CS24-018", 2022, "The tap is fixed and the bathroom is usable again.");
    expect(message).toContain("Ananya");
    expect(message).toContain("#2022");
    expect(message).toContain("The tap is fixed");
  });

  it("encodes meaning-preserving translation requirements and the original text", () => {
    const messages = createMeaningPreservingTranslationMessages("Paani nahi aa raha, please jaldi check karo.");
    expect(messages[0].content).toContain("Detect Hinglish, Tamil-English");
    expect(messages[0].content).toContain("Preserve every factual detail");
    expect(messages[1].content).toBe("Paani nahi aa raha, please jaldi check karo.");
  });

  it("uses a durable read-at timestamp when notifications are marked read", () => {
    const timestamp = new Date("2026-08-31T10:00:00.000Z");
    expect(notificationReadPatch(timestamp)).toEqual({ isRead: true, readAt: timestamp });
  });

  it("classifies live complaint language into all four heat-map severity levels", () => {
    expect(classifyReportSeverity("Safety emergency", "There is smoke in the corridor.")).toBe("CRITICAL");
    expect(classifyReportSeverity("Water leakage", "The washroom pipe is broken.")).toBe("HIGH");
    expect(classifyReportSeverity("Housekeeping", "The common room needs cleaning.")).toBe("MEDIUM");
    expect(classifyReportSeverity("Lost and found", "I misplaced a notebook near the library.")).toBe("LOW");
  });

  it("groups live reports by block and leaves empty blocks available for the no-pending path", () => {
    const grouped = groupReportsByBlock([
      { block: "c", severity: "HIGH" as const },
      { block: "C", severity: "LOW" as const },
      { location: "A Block", severity: "CRITICAL" as const },
    ]);
    expect(grouped.C).toHaveLength(2);
    expect(grouped.A).toHaveLength(1);
    expect(grouped.B).toHaveLength(0);
    expect(dominantReportSeverity(grouped.C)).toBe("HIGH");
  });

  it("maps each dominant live severity to the requested heat-map color", () => {
    expect(heatMapColorForReports([{ severity: "CRITICAL" }])).toBe("red");
    expect(heatMapColorForReports([{ severity: "HIGH" }])).toBe("yellow");
    expect(heatMapColorForReports([{ severity: "MEDIUM" }])).toBe("green");
    expect(heatMapColorForReports([{ severity: "LOW" }])).toBe("blue");
    expect(heatMapColorForReports([{ severity: "LOW" }, { severity: "CRITICAL" }])).toBe("red");
  });

  it("filters map locations by exact database identifiers and sorts complaints by priority", () => {
    const reports = [
      { block: "D", severity: "HIGH" as const, priorityScore: 48, createdAt: "2026-09-01T10:00:00.000Z" },
      { block: "E", severity: "CRITICAL" as const, priorityScore: 96, createdAt: "2026-09-01T09:00:00.000Z" },
      { block: "AB-2", severity: "LOW" as const, priorityScore: 12, createdAt: "2026-09-01T08:00:00.000Z" },
    ];
    expect(reports.filter((report) => reportBelongsToCampusMapLocation(report, "de"))).toHaveLength(2);
    expect(reports.filter((report) => reportBelongsToCampusMapLocation(report, "ab2"))).toHaveLength(1);
    expect(reports.filter((report) => reportBelongsToCampusMapLocation(report, "c"))).toHaveLength(0);
    expect(sortCampusMapReportsByPriority(reports).map((report) => report.priorityScore)).toEqual([96, 48, 12]);
  });

  it("keeps combined image locations split into independent complaint sections", () => {
    expect(CAMPUS_MAP_LOCATION_IDENTIFIERS.de).toEqual(["D", "E"]);
    expect(CAMPUS_MAP_LOCATION_IDENTIFIERS.libraryAdmin).toEqual(["Library", "Administrative Block"]);
  });

  it("aggregates exactly one activity dot per active location using highest severity", () => {
    const activity = campusMapActivity([
      { block: "AB-1", status: "New", severity: "MEDIUM" as const },
      { block: "AB-1", status: "New", severity: "CRITICAL" as const },
      { block: "AB-1", status: "Resolved", severity: "CRITICAL" as const },
      { block: "D", status: "New", severity: "MEDIUM" as const },
      { block: "E", status: "New", severity: "HIGH" as const },
      { block: "Library", status: "completed", severity: "CRITICAL" as const },
      { block: "Administrative Block", status: "In Progress", severity: "LOW" as const },
    ]);
    expect(activity.ab1).toEqual({ count: 2, color: "red" });
    expect(activity.de).toEqual({ count: 2, color: "yellow" });
    expect(activity.libraryAdmin).toEqual({ count: 1, color: "blue" });
    expect(activity.ab2).toEqual({ count: 0, color: null });
  });

  it("builds the overview graph from real seven-day dates and compares the prior period", () => {
    const now = new Date("2026-08-31T12:00:00.000Z");
    const series = buildReportTrendSeries([
      { createdAt: new Date("2026-08-31T09:00:00.000Z") },
      { createdAt: new Date("2026-08-30T09:00:00.000Z") },
      { createdAt: new Date("2026-08-29T09:00:00.000Z") },
      { createdAt: new Date("2026-08-24T09:00:00.000Z") },
      { createdAt: new Date("2026-08-23T09:00:00.000Z") },
    ], now);
    expect(series.total).toBe(3);
    expect(series.counts.at(-1)).toBe(1);
    expect(series.previousTotal).toBe(2);
    expect(series.changePercent).toBe(50);
    expect(series.labels.at(-1)).toBe("Today");
  });

  it("derives overview totals from active and logged complaint data", () => {
    const metrics = buildOverviewMetrics([
      { status: "New", severity: "LOW" },
      { status: "Assigned", severity: "HIGH" },
      { status: "In Progress", severity: "CRITICAL" },
      { status: "Seen", severity: "CRITICAL" },
    ], [
      { status: "Resolved", severity: "MEDIUM" },
      { status: "Resolved", severity: "LOW" },
    ]);
    expect(metrics.total).toBe(6);
    expect(metrics.newCount).toBe(1);
    expect(metrics.assigned).toBe(2);
    expect(metrics.resolved).toBe(2);
    expect(metrics.critical).toBe(2);
  });

  it("keeps empty overview metrics and trend baselines honest", () => {
    const metrics = buildOverviewMetrics([], []);
    const series = buildReportTrendSeries([], new Date("2026-08-31T12:00:00.000Z"));
    expect(metrics).toMatchObject({ total: 0, newCount: 0, assigned: 0, resolved: 0, critical: 0 });
    expect(series.total).toBe(0);
    expect(series.previousTotal).toBe(0);
    expect(series.changePercent).toBeNull();
  });
});
