import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, STUDENT_SESSION_COOKIE, STUDENT_SESSION_MAX_AGE_MS } from "@shared/const";
import { BLOCKS, FLOOR_VALUES, ISSUE_VALUES, MESS_CATEGORIES, MESS_ISSUE_CATALOG, MESS_LOCATIONS, REPRESENTATIVE_ROLES, ROOM_TYPES } from "@shared/campus";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router, studentProcedure } from "./_core/trpc";
import {
  addReportFeedback,
  createAdminAccount,
  createEmployee,
  createNotification,
  createReport,
  createStudent,
  createStudentSession,
  deleteEmployee,
  deleteStudentSession,
  findDuplicateReport,
  getAdminByAdminId,
  getAdminById,
  getEmployeeById,
  getReportById,
  getReportsByStudent,
  getStudentByRegistrationNumber,
  getStudentNotifications,
  getAdminNotifications,
  listAdminAccounts,
  listActiveAdminReports,
  listEmployees,
  listFeedback,
  markFeedbackViewed,
  markReportViewed,
  listLoggedAdminReports,
  markAllNotificationsRead,
  markNotificationRead,
  touchAdminSignIn,
  updateAdminAccount,
  updateReportStatus,
  updateStudentLocation,
  updateStudentProfile,
} from "./db";
import { clearAccountSession, DEMO_ADMIN_PASSWORD, getAccountIdFromSession, hashAdminPassword, isValidDemoPassword, setAccountSession } from "./accountAuth";
import { buildDedupeKey, createSessionToken, hashPassword, hashSessionToken, normalizeRegistrationNumber, verifyPassword } from "./studentAuth";
import { storagePut } from "./storage";
import { classifyReportWithAI, persistedPriorityFields } from "./aiPriority";

const registrationSchema = z.string().trim().min(4).max(32).transform(normalizeRegistrationNumber);
const passwordSchema = z.string().min(8).max(128);
const studentCookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: STUDENT_SESSION_MAX_AGE_MS / 1000 };
function readCookie(value: string | undefined, key: string) { return value?.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${key}=`))?.split("=").slice(1).join("="); }
function setStudentCookie(res: any, token: string) { if (res.cookie) res.cookie(STUDENT_SESSION_COOKIE, token, studentCookieOptions); else res.setHeader("Set-Cookie", `${STUDENT_SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${studentCookieOptions.maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`); }
function clearStudentCookie(res: any) { if (res.clearCookie) res.clearCookie(STUDENT_SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: "lax", path: "/" }); else res.setHeader("Set-Cookie", `${STUDENT_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`); }
function accountFrom(ctx: any) { const id = getAccountIdFromSession(ctx.req); return id ? getAdminById(id) : undefined; }
function outputAccount(account: any) { return account && { id: account.id, adminId: account.adminId, name: account.name, email: account.email, bio: account.bio, position: account.position, profileImageUrl: account.profileImageUrl, theme: account.theme, readingMode: Boolean(account.readingMode) }; }
function textFromContent(content: unknown) { if (typeof content === "string") return content.trim(); if (Array.isArray(content)) return content.map((part: any) => typeof part === "string" ? part : part?.text || "").join("\n").trim(); return ""; }
function reportLabel(reportId: number) { return `#${String(reportId).padStart(4, "0")}`; }
export function isActiveReportStatus(status: string) { return status !== "completed"; }
export function createMeaningPreservingTranslationMessages(text: string) { return [{ role: "system" as const, content: "You are a careful campus operations translator. Translate the student’s text into clear, natural English. Detect Hinglish, Tamil-English, code-switching, slang, and other languages. Preserve every factual detail, urgency, uncertainty, tone, quantities, locations, and time references. Do not summarize, embellish, soften, or add information. Return only the translation, with no preface or quotation marks." }, { role: "user" as const, content: text }]; }
export function buildFeedbackNotificationMessage(studentName: string, registrationNumber: string, reportId: number, feedbackText: string) { return `${studentName || registrationNumber} left feedback on complaint ${reportLabel(reportId)}: “${feedbackText.slice(0, 180)}${feedbackText.length > 180 ? "…" : ""}”`; }
export function buildAssignmentNotificationMessage(adminName: string, facultyName: string, reportId: number, issueType: string, block: string, floor: string) { return `${adminName} assigned ${facultyName} to complaint ${reportLabel(reportId)} about “${issueType}” in ${block} Block · ${floor}.`; }
export function buildResolutionNotificationMessage(adminName: string, facultyName: string | null | undefined, reportId: number, issueType: string, block: string) { return `${adminName} resolved complaint ${reportLabel(reportId)} about “${issueType}” in ${block} Block${facultyName ? ` after work by ${facultyName}` : ""}. Please check the area and leave feedback if needed.`; }
async function notifyAllAdmins(input: { kind: string; title: string; message: string; reportId?: number | null }) { const admins = await listAdminAccounts(); await Promise.all(admins.map((admin) => createNotification({ recipientType: "admin", recipientId: admin.id, kind: input.kind, title: input.title, message: input.message, reportId: input.reportId ?? null }))); }
async function notifyStudent(studentId: number, input: { kind: string; title: string; message: string; reportId?: number | null }) { return createNotification({ recipientType: "student", recipientId: studentId, kind: input.kind, title: input.title, message: input.message, reportId: input.reportId ?? null }); }

export function decodeAdminProfileImage(dataUrl: string, mimeHint?: string) { const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl); if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Profile picture must be a PNG, JPEG, or WebP image." }); const mimeType = match[1]; const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64"); if (!buffer.length || buffer.length > 3_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Profile picture must be smaller than 3 MB." }); const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1]; if (mimeHint && mimeHint !== mimeType) throw new TRPCError({ code: "BAD_REQUEST", message: "Profile picture type does not match its file content." }); return { buffer, mimeType, extension }; }
export function decodeEvidenceImage(dataUrl: string) { const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl); if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence must be a PNG, JPEG, or WebP image." }); const mimeType = match[1]; const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64"); if (!buffer.length || buffer.length > 5_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence images must be smaller than 5 MB." }); const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1]; return { buffer, mimeType, extension }; }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.student ?? null),
    session: publicProcedure.query(({ ctx }) => ctx.student ? { role: "student" as const, identity: ctx.student } : ctx.admin ? { role: "admin" as const, identity: ctx.admin } : null),
    register: publicProcedure.input(z.object({ registrationNumber: registrationSchema, password: passwordSchema, name: z.string().trim().max(160).optional() })).mutation(async ({ input, ctx }) => { if (await getStudentByRegistrationNumber(input.registrationNumber)) throw new TRPCError({ code: "CONFLICT", message: "That registration number is already registered." }); const student = await createStudent({ registrationNumber: input.registrationNumber, passwordHash: hashPassword(input.password), name: input.name || null }); if (!student) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create the student account." }); const token = createSessionToken(); await createStudentSession(student.id, hashSessionToken(token), new Date(Date.now() + STUDENT_SESSION_MAX_AGE_MS)); setStudentCookie(ctx.res, token); return student; }),
    login: publicProcedure.input(z.object({ registrationNumber: registrationSchema, password: passwordSchema })).mutation(async ({ input, ctx }) => { const student = await getStudentByRegistrationNumber(input.registrationNumber); if (!student || !verifyPassword(input.password, student.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Registration number or password is incorrect." }); const token = createSessionToken(); await createStudentSession(student.id, hashSessionToken(token), new Date(Date.now() + STUDENT_SESSION_MAX_AGE_MS)); setStudentCookie(ctx.res, token); return student; }),
    logout: publicProcedure.mutation(async ({ ctx }) => { const token = readCookie(ctx.req.headers.cookie, STUDENT_SESSION_COOKIE); if (token) { await deleteStudentSession(hashSessionToken(decodeURIComponent(token))); clearStudentCookie(ctx.res); } ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); const hasAccountSession = Boolean(readCookie(ctx.req.headers.cookie, "campus_scope_session")); if (hasAccountSession) clearAccountSession(ctx.res); return { success: true } as const; }),
  }),
  student: router({
    profile: studentProcedure.query(({ ctx }) => ctx.student),
    updateProfile: studentProcedure.input(z.object({ name: z.string().trim().min(2).max(160).optional(), course: z.string().trim().max(120).nullable().optional(), roomNumber: z.string().trim().max(32).nullable().optional(), roomType: z.enum(ROOM_TYPES).nullable().optional(), isHostelRepresentative: z.boolean().optional(), representativeRole: z.enum(REPRESENTATIVE_ROLES).optional(), profilePhotoUrl: z.string().max(512).nullable().optional(), locationTrackingEnabled: z.boolean().optional() })).mutation(({ input, ctx }) => updateStudentProfile(ctx.student.id, { ...input, representativeRole: input.isHostelRepresentative ? input.representativeRole ?? "none" : input.isHostelRepresentative === false ? "none" : input.representativeRole })),
    updateLocation: studentProcedure.input(z.object({ latitude: z.number(), longitude: z.number() })).mutation(({ input, ctx }) => updateStudentLocation(ctx.student.id, input)),
    uploadProfilePhoto: studentProcedure.input(z.object({ dataUrl: z.string() })).mutation(async ({ input, ctx }) => { const image = decodeEvidenceImage(input.dataUrl); const uploaded = await storagePut(`student-profiles/${ctx.student.id}/profile.${image.extension}`, image.buffer, image.mimeType); return updateStudentProfile(ctx.student.id, { profilePhotoUrl: uploaded.url }); }),
    uploadReportEvidence: studentProcedure.input(z.object({ dataUrl: z.string() })).mutation(async ({ input, ctx }) => { const image = decodeEvidenceImage(input.dataUrl); const uploaded = await storagePut(`report-evidence/${ctx.student.id}/${Date.now()}.${image.extension}`, image.buffer, image.mimeType); return { url: uploaded.url }; }),
    reports: studentProcedure.query(({ ctx }) => getReportsByStudent(ctx.student.id)),
    notifications: studentProcedure.query(({ ctx }) => getStudentNotifications(ctx.student.id)),
    markNotificationRead: studentProcedure.input(z.object({ notificationId: z.number() })).mutation(({ input, ctx }) => markNotificationRead(input.notificationId, "student", ctx.student.id)),
    markAllNotificationsRead: studentProcedure.mutation(({ ctx }) => markAllNotificationsRead("student", ctx.student.id)),
    createReport: studentProcedure.input(z.object({ issueType: z.string().min(2), description: z.string().trim().min(10).max(5000), block: z.string(), floor: z.string(), messName: z.string().nullable().optional(), messCategory: z.string().nullable().optional(), messIssueType: z.string().nullable().optional(), evidenceUrl: z.string().nullable().optional(), latitude: z.number().nullable().optional(), longitude: z.number().nullable().optional() })).mutation(async ({ input, ctx }) => { const key = buildDedupeKey(input as any); if (await findDuplicateReport(ctx.student.id, key)) throw new TRPCError({ code: "CONFLICT", message: "You already submitted this same unresolved issue for this location." }); const aiPriority = await classifyReportWithAI(input.issueType, input.description); const report = await createReport({ ...input, ...persistedPriorityFields(aiPriority), studentId: ctx.student.id, dedupeKey: key, status: "submitted", locationCapturedAt: input.latitude != null && input.longitude != null ? new Date() : null }); if (report) await notifyAllAdmins({ kind: "new_report", title: "New complaint received", message: `${ctx.student.name || ctx.student.registrationNumber} submitted “${input.issueType}” in ${input.block} Block · ${input.floor}. Review complaint ${reportLabel(report.id)}.`, reportId: report.id }); return report; }),
    addFeedback: studentProcedure.input(z.object({ reportId: z.number(), feedback: z.string().trim().min(3).max(1000) })).mutation(async ({ input, ctx }) => { const report = await getReportById(input.reportId); if (!report || report.studentId !== ctx.student.id) throw new TRPCError({ code: "NOT_FOUND", message: "That complaint could not be found." }); if (report.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Feedback is available after a complaint is resolved." }); const saved = await addReportFeedback(ctx.student.id, input.reportId, input.feedback); await notifyAllAdmins({ kind: "feedback", title: "Student feedback received", message: buildFeedbackNotificationMessage(ctx.student.name || "", ctx.student.registrationNumber, input.reportId, input.feedback), reportId: input.reportId }); return saved; }),
    guidance: studentProcedure.input(z.object({ issueType: z.string(), description: z.string(), status: z.string() })).query(({ input }) => ({ guidance: input.status === "completed" ? "The team marked this completed. Check the area and leave feedback if anything still needs attention." : "Your report is in the campus review queue. Keep the area accessible if it is safe to do so." })),
  }),
  admin: router({
    me: publicProcedure.query(async ({ ctx }) => outputAccount(await accountFrom(ctx)) ?? null),
    login: publicProcedure.input(z.object({ adminId: z.string().trim().min(3), password: z.string().optional() })).mutation(async ({ input, ctx }) => { const account = await getAdminByAdminId(input.adminId); if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "No admin account was found for that ID." }); if (input.password && hashAdminPassword(input.password) !== account.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin ID or password is incorrect." }); await touchAdminSignIn(account.id); setAccountSession(ctx.res, account.id); return outputAccount(await getAdminById(account.id)); }),
    createAccount: publicProcedure.input(z.object({ adminId: z.string().trim().min(3).regex(/^[a-zA-Z0-9._-]+$/), name: z.string().trim().min(2), employeeId: z.string().trim().min(1).optional(), email: z.string().trim().email().optional().or(z.literal("")), password: z.string().min(8), fixedAdminPassword: z.string().min(1).optional() })).mutation(async ({ input, ctx }) => { if (!isValidDemoPassword(input.fixedAdminPassword ?? input.password)) throw new TRPCError({ code: "BAD_REQUEST", message: `Use the fixed admin authorization password: ${DEMO_ADMIN_PASSWORD}` }); if (await getAdminByAdminId(input.adminId)) throw new TRPCError({ code: "CONFLICT", message: "That admin ID already exists. Try logging in instead." }); const account = await createAdminAccount({ adminId: input.adminId, employeeId: input.employeeId, passwordHash: hashAdminPassword(input.password), name: input.name, email: input.email || null }); setAccountSession(ctx.res, account!.id); return outputAccount(account); }),
    logout: publicProcedure.mutation(({ ctx }) => { clearAccountSession(ctx.res); return { success: true } as const; }),
    updateProfile: publicProcedure.input(z.object({ name: z.string().min(2), bio: z.string().max(500), position: z.string().min(2), profileImageDataUrl: z.string().max(4_500_000).optional(), profileImageMimeType: z.string().optional() })).mutation(async ({ input, ctx }) => { const account = await accountFrom(ctx); if (!account) throw new TRPCError({ code: "UNAUTHORIZED" }); let profileImageUrl: string | undefined; if (input.profileImageDataUrl) { const image = decodeAdminProfileImage(input.profileImageDataUrl, input.profileImageMimeType); const uploaded = await storagePut(`admin-profiles/${account.id}/profile.${image.extension}`, image.buffer, image.mimeType); profileImageUrl = uploaded.url; } return outputAccount(await updateAdminAccount(account.id, { name: input.name, bio: input.bio, position: input.position, ...(profileImageUrl ? { profileImageUrl } : {}) })); }),
    updatePreferences: publicProcedure.input(z.object({ theme: z.enum(["dark", "light"]), readingMode: z.boolean() })).mutation(async ({ input, ctx }) => { const account = await accountFrom(ctx); if (!account) throw new TRPCError({ code: "UNAUTHORIZED" }); return outputAccount(await updateAdminAccount(account.id, { theme: input.theme, readingMode: input.readingMode ? 1 : 0 })); }),
    reports: adminProcedure.query(() => listActiveAdminReports()),
    loggedReports: adminProcedure.query(() => listLoggedAdminReports()),
    feedback: adminProcedure.query(() => listFeedback()),
    viewFeedback: adminProcedure.input(z.object({ feedbackId: z.number() })).mutation(({ input }) => markFeedbackViewed(input.feedbackId)),
    notifications: adminProcedure.query(async ({ ctx }) => { const account = await accountFrom(ctx); if (!account) throw new TRPCError({ code: "UNAUTHORIZED" }); return getAdminNotifications(account.id); }),
    markNotificationRead: adminProcedure.input(z.object({ notificationId: z.number() })).mutation(async ({ input, ctx }) => { const account = await accountFrom(ctx); if (!account) throw new TRPCError({ code: "UNAUTHORIZED" }); return markNotificationRead(input.notificationId, "admin", account.id); }),
    markAllNotificationsRead: adminProcedure.mutation(async ({ ctx }) => { const account = await accountFrom(ctx); if (!account) throw new TRPCError({ code: "UNAUTHORIZED" }); return markAllNotificationsRead("admin", account.id); }),
    translate: adminProcedure.input(z.object({ text: z.string().trim().min(1).max(5000) })).mutation(async ({ input }) => { const result = await invokeLLM({ model: "gpt-5-mini", maxTokens: 900, messages: createMeaningPreservingTranslationMessages(input.text) }); const translation = textFromContent(result.choices[0]?.message?.content); if (!translation) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Translation returned no text. Please try again." }); return { translation }; }),
    employees: adminProcedure.query(() => listEmployees()),
    addEmployee: adminProcedure.input(z.object({ name: z.string().min(2), employeeId: z.string().min(1), department: z.string().optional(), phone: z.string().optional() })).mutation(({ input }) => createEmployee({ ...input, department: input.department ?? "Facilities" })),
    removeEmployee: adminProcedure.input(z.object({ employeeId: z.number() })).mutation(async ({ input }) => { try { return await deleteEmployee(input.employeeId); } catch (error) { if (String(error).includes("employee is managing a complaint")) throw new TRPCError({ code: "CONFLICT", message: "employee is managing a complaint" }); throw error; } }),
    reviewReport: adminProcedure.input(z.object({ reportId: z.number() })).mutation(async ({ input, ctx }) => { const account = await accountFrom(ctx); const report = await getReportById(input.reportId); if (!account || !report) throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found." }); const wasSubmitted = report.status === "submitted"; const updated = await markReportViewed(input.reportId); if (wasSubmitted) await notifyStudent(report.studentId, { kind: "reviewed", title: "Your complaint is being reviewed", message: `${account.name} is reviewing complaint ${reportLabel(report.id)} about “${report.issueType}” in ${report.block} Block.`, reportId: report.id }); return updated; }),
    assignReport: adminProcedure.input(z.object({ reportId: z.number(), employeeId: z.number() })).mutation(async ({ input, ctx }) => { const account = await accountFrom(ctx); const report = await getReportById(input.reportId); const employee = await getEmployeeById(input.employeeId); if (!account || !report || !employee) throw new TRPCError({ code: "NOT_FOUND", message: "Complaint or faculty member not found." }); const updated = await updateReportStatus(input.reportId, "assigned", input.employeeId); await notifyStudent(report.studentId, { kind: "assigned", title: "A faculty member was assigned", message: buildAssignmentNotificationMessage(account.name, employee.name, report.id, report.issueType, report.block, report.floor), reportId: report.id }); return updated; }),
    completeReport: adminProcedure.input(z.object({ reportId: z.number() })).mutation(async ({ input, ctx }) => { const account = await accountFrom(ctx); const report = await getReportById(input.reportId); if (!account || !report) throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found." }); const updated = await updateReportStatus(input.reportId, "completed"); await notifyStudent(report.studentId, { kind: "resolved", title: "Your complaint was resolved", message: buildResolutionNotificationMessage(account.name, report.workerName, report.id, report.issueType, report.block), reportId: report.id }); return updated; }),
  }),
});
export type AppRouter = typeof appRouter;
