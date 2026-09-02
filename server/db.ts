import { and, desc, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { classifyReportSeverity } from "../shared/reportSeverity";
import { AI_PRIORITY_RANK } from "./aiPriority";
import { adminAccounts, employees, feedback, notifications, reports, studentSessions, students, users, type InsertUser } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser) {
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"), lastSignedIn: new Date() };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, role: values.role, lastSignedIn: values.lastSignedIn } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getStudentByRegistrationNumber(registrationNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(students).where(eq(students.registrationNumber, registrationNumber)).limit(1))[0];
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(students).where(eq(students.id, id)).limit(1))[0];
}

export async function createStudent(input: typeof students.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(students).values(input);
  return getStudentByRegistrationNumber(input.registrationNumber);
}

export async function getStudentBySessionHash(tokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select({ student: students }).from(studentSessions).innerJoin(students, eq(studentSessions.studentId, students.id)).where(and(eq(studentSessions.tokenHash, tokenHash), gt(studentSessions.expiresAt, new Date()))).limit(1))[0]?.student;
}

export async function createStudentSession(studentId: number, tokenHash: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(studentSessions).values({ studentId, tokenHash, expiresAt });
}

export async function deleteStudentSession(tokenHash: string) {
  const db = await getDb();
  if (db) await db.delete(studentSessions).where(eq(studentSessions.tokenHash, tokenHash));
}

export async function updateStudentProfile(id: number, input: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(students).set(input).where(eq(students.id, id));
  return getStudentById(id);
}

export async function updateStudentLocation(id: number, input: { latitude: number; longitude: number }) {
  return updateStudentProfile(id, { lastLatitude: input.latitude, lastLongitude: input.longitude, lastLocationAt: new Date(), locationTrackingEnabled: true });
}

export async function findDuplicateReport(studentId: number, dedupeKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(reports).where(and(eq(reports.studentId, studentId), eq(reports.dedupeKey, dedupeKey), ne(reports.status, "completed"))).limit(1))[0];
}

export async function createReport(input: typeof reports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(reports).values(input);
  return (await db.select().from(reports).where(and(eq(reports.studentId, input.studentId), eq(reports.dedupeKey, input.dedupeKey))).orderBy(desc(reports.createdAt)).limit(1))[0];
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(reports).where(eq(reports.id, id)).limit(1))[0];
}

export async function getReportsByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reports.id,
    studentId: reports.studentId,
    issueType: reports.issueType,
    description: reports.description,
    block: reports.block,
    floor: reports.floor,
    messName: reports.messName,
    messCategory: reports.messCategory,
    messIssueType: reports.messIssueType,
    evidenceUrl: reports.evidenceUrl,
    latitude: reports.latitude,
    longitude: reports.longitude,
    status: reports.status,
    employeeId: reports.employeeId,
    workerName: reports.workerName,
    reviewedAt: reports.reviewedAt,
    assignedAt: reports.assignedAt,
    completedAt: reports.completedAt,
    createdAt: reports.createdAt,
    updatedAt: reports.updatedAt,
    feedback: feedback.message,
    feedbackRating: feedback.rating,
    feedbackCreatedAt: feedback.createdAt,
  }).from(reports).leftJoin(feedback, eq(feedback.reportId, reports.id)).where(eq(reports.studentId, studentId)).orderBy(desc(reports.createdAt));
}

export async function updateReportStatus(reportId: number, status: "reviewed" | "assigned" | "in_progress" | "completed", employeeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const now = new Date();
  const values: Record<string, unknown> = { status };
  if (status === "reviewed") values.reviewedAt = now;
  if (status === "assigned" || status === "in_progress") {
    values.employeeId = employeeId ?? null;
    values.assignedAt = now;
    values.workerName = employeeId ? (await getEmployeeById(employeeId))?.name ?? null : null;
  }
  if (status === "completed") values.completedAt = now;
  await db.update(reports).set(values).where(eq(reports.id, reportId));
  return getReportById(reportId);
}

export async function markReportViewed(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(reports).set({ status: "reviewed", reviewedAt: new Date() }).where(and(eq(reports.id, reportId), eq(reports.status, "submitted")));
  return getReportById(reportId);
}

export async function addReportFeedback(studentId: number, reportId: number, message: string, rating?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(feedback).values({ reportId, studentId, message, rating: rating ?? null }).onDuplicateKeyUpdate({ set: { message, rating: rating ?? null } });
  return (await db.select().from(feedback).where(and(eq(feedback.reportId, reportId), eq(feedback.studentId, studentId))).limit(1))[0];
}

export async function getAdminByAdminId(adminId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(adminAccounts).where(eq(adminAccounts.adminId, adminId)).limit(1))[0];
}

export async function getAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(adminAccounts).where(eq(adminAccounts.id, id)).limit(1))[0];
}

export async function listAdminAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: adminAccounts.id, name: adminAccounts.name }).from(adminAccounts);
}

export async function createAdminAccount(input: typeof adminAccounts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(adminAccounts).values(input);
  return getAdminByAdminId(input.adminId);
}

export async function updateAdminAccount(id: number, input: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(adminAccounts).set(input).where(eq(adminAccounts.id, id));
  return getAdminById(id);
}

export async function touchAdminSignIn(id: number) {
  return updateAdminAccount(id, { lastSignedIn: new Date() });
}

export async function listEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: employees.id, name: employees.name, employeeId: employees.employeeId, department: employees.department, phone: employees.phone, createdAt: employees.createdAt, activeComplaintCount: sql<number>`(select count(*) from reports where reports.employeeId = employees.id and reports.status <> 'completed')` }).from(employees).orderBy(employees.name);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(employees).where(eq(employees.id, id)).limit(1))[0];
}

export async function createEmployee(input: typeof employees.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(employees).values(input);
  return listEmployees();
}

export function assertEmployeeCanBeRemoved(activeComplaintCount: number) {
  if (activeComplaintCount > 0) throw new Error("employee is managing a complaint");
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const active = await db.select({ id: reports.id }).from(reports).where(and(eq(reports.employeeId, id), ne(reports.status, "completed"))).limit(1);
  assertEmployeeCanBeRemoved(active.length);
  await db.delete(employees).where(eq(employees.id, id));
  return listEmployees();
}

function addReportSeverity<T extends { report: { issueType: string; description: string; aiSeverity?: string | null; aiPriorityScore?: number | null; aiPriorityReason?: string | null } }>(rows: T[]) {
  return rows.map((entry) => {
    const severity = entry.report.aiSeverity || classifyReportSeverity(entry.report.issueType, entry.report.description);
    const normalizedSeverity = severity === "LOW" || severity === "MEDIUM" || severity === "HIGH" || severity === "CRITICAL" ? severity : "LOW";
    return { ...entry, report: { ...entry.report, severity: normalizedSeverity, priorityScore: entry.report.aiPriorityScore ?? AI_PRIORITY_RANK[normalizedSeverity], priorityReason: entry.report.aiPriorityReason ?? null } };
  });
}

export async function listAdminReports() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ report: reports, student: students, employee: employees }).from(reports).innerJoin(students, eq(reports.studentId, students.id)).leftJoin(employees, eq(reports.employeeId, employees.id)).orderBy(desc(reports.createdAt));
  return addReportSeverity(rows);
}

export const FEEDBACK_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function feedbackExpiryFromFirstView(viewedAt: Date) {
  return new Date(viewedAt.getTime() + FEEDBACK_EXPIRY_MS);
}

export function shouldStampFeedbackView(viewedAt: Date | null | undefined) {
  return viewedAt == null;
}

export async function markFeedbackViewed(feedbackId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const now = new Date();
  const expiry = feedbackExpiryFromFirstView(now);
  await db.update(feedback).set({ viewedAt: now, expiresAt: expiry }).where(and(eq(feedback.id, feedbackId), sql`${feedback.viewedAt} IS NULL`, or(sql`${feedback.expiresAt} IS NULL`, gt(feedback.expiresAt, now))));
  return (await db.select().from(feedback).where(and(eq(feedback.id, feedbackId), or(sql`${feedback.expiresAt} IS NULL`, gt(feedback.expiresAt, now)))).limit(1))[0];
}

export async function listFeedback() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ feedback, report: reports, student: students }).from(feedback).innerJoin(reports, eq(feedback.reportId, reports.id)).innerJoin(students, eq(feedback.studentId, students.id)).where(or(sql`${feedback.expiresAt} IS NULL`, gt(feedback.expiresAt, new Date()))).orderBy(desc(feedback.createdAt));
}

export async function deleteExpiredFeedback(now = new Date()) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(feedback).where(and(sql`${feedback.expiresAt} IS NOT NULL`, lt(feedback.expiresAt, now)));
  return Number((result as any).rowsAffected ?? 0);
}

export async function createNotification(input: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(notifications).values(input);
  return (await db.select().from(notifications).where(and(eq(notifications.recipientType, input.recipientType), eq(notifications.recipientId, input.recipientId))).orderBy(desc(notifications.createdAt)).limit(1))[0];
}

function notificationSelect(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, recipientType: "student" | "admin", recipientId: number) {
  return db.select({
    id: notifications.id,
    recipientType: notifications.recipientType,
    recipientId: notifications.recipientId,
    kind: notifications.kind,
    title: notifications.title,
    message: notifications.message,
    reportId: notifications.reportId,
    reportNumber: reports.id,
    reportIssueType: reports.issueType,
    reportBlock: reports.block,
    isRead: notifications.isRead,
    readAt: notifications.readAt,
    createdAt: notifications.createdAt,
  }).from(notifications).leftJoin(reports, eq(notifications.reportId, reports.id)).where(and(eq(notifications.recipientType, recipientType), eq(notifications.recipientId, recipientId))).orderBy(desc(notifications.createdAt));
}

export async function getStudentNotifications(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return notificationSelect(db, "student", studentId);
}

export async function getAdminNotifications(adminId: number) {
  const db = await getDb();
  if (!db) return [];
  return notificationSelect(db, "admin", adminId);
}

export function notificationReadPatch(readAt = new Date()) { return { isRead: true, readAt }; }

export async function markNotificationRead(id: number, recipientType: "student" | "admin", recipientId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set(notificationReadPatch()).where(and(eq(notifications.id, id), eq(notifications.recipientType, recipientType), eq(notifications.recipientId, recipientId)));
}

export async function markAllNotificationsRead(recipientType: "student" | "admin", recipientId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set(notificationReadPatch()).where(and(eq(notifications.recipientType, recipientType), eq(notifications.recipientId, recipientId), eq(notifications.isRead, false)));
}

export async function listLoggedAdminReports() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ report: reports, student: students, employee: employees }).from(reports).innerJoin(students, eq(reports.studentId, students.id)).leftJoin(employees, eq(reports.employeeId, employees.id)).where(eq(reports.status, "completed")).orderBy(desc(reports.completedAt), desc(reports.createdAt));
  return addReportSeverity(rows);
}

export async function listActiveAdminReports() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ report: reports, student: students, employee: employees }).from(reports).innerJoin(students, eq(reports.studentId, students.id)).leftJoin(employees, eq(reports.employeeId, employees.id)).where(ne(reports.status, "completed")).orderBy(desc(reports.createdAt));
  return addReportSeverity(rows);
}
