import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { ok, err } from "../_shared/response.ts";
import { callMoodle } from "../_shared/moodle.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

interface ActivityCompletion {
  complete: boolean;
}

interface CourseCompletionStatus {
  completed: boolean;
  completions: ActivityCompletion[];
}

interface MoodleCompletionResponse {
  completionstatus: CourseCompletionStatus;
}

interface GradeItem {
  graderaw: number | null;
  grademin: number;
  grademax: number;
  percentageformatted?: string;
  itemtype?: string;
}

interface GradeReport {
  usergrades: Array<{ gradeitems: GradeItem[] }>;
}

function isAccessException(e: unknown): boolean {
  const msg = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
  return (
    msg.includes("accessexception") ||
    msg.includes("access control exception") ||
    msg.includes("accessdenied") ||
    msg.includes("nopermissions")
  );
}

function deriveCourseStatus(completed: boolean, completions: ActivityCompletion[]): string {
  if (completed) return "completed";
  const anyDone = completions.some((c) => c.complete);
  return anyDone ? "in_progress" : "not_started";
}

function deriveProgress(completed: boolean, completions: ActivityCompletion[]): number {
  if (completed) return 100;
  if (!completions.length) return 0;
  const done = completions.filter((c) => c.complete).length;
  return Math.round((done / completions.length) * 100);
}

function progressFromGrades(report: GradeReport): { progress: number; courseStatus: string } {
  const items = report?.usergrades?.[0]?.gradeitems ?? [];
  const activityItems = items.filter((g) => g.itemtype !== "course");
  if (!activityItems.length) return { progress: 0, courseStatus: "not_started" };
  const graded = activityItems.filter((g) => g.graderaw !== null && g.graderaw !== undefined).length;
  const progress = Math.round((graded / activityItems.length) * 100);
  const courseStatus = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "not_started";
  return { progress, courseStatus };
}

// Syncs a single participant_trainings row
async function syncRow(
  supabase: ReturnType<typeof createAdminClient>,
  pt: { id: string; moodle_course_id: string; moodle_user_id: string; participant_id: string }
): Promise<{ ok: boolean; error?: string; method?: string }> {
  const courseId = Number(pt.moodle_course_id);
  const userId = Number(pt.moodle_user_id);

  let courseStatus: string;
  let progress: number;
  let moodleStatus: string;
  let method = "completion";

  try {
    const result = await callMoodle("core_completion_get_course_completion_status", {
      courseid: courseId,
      userid: userId,
    }) as MoodleCompletionResponse;

    const cs = result?.completionstatus;
    if (!cs) throw new Error("Unexpected Moodle response shape");

    const completions: ActivityCompletion[] = cs.completions ?? [];
    courseStatus = deriveCourseStatus(cs.completed, completions);
    progress = deriveProgress(cs.completed, completions);
    moodleStatus = cs.completed ? "completed" : "enrolled";
  } catch (primaryErr) {
    if (isAccessException(primaryErr) || (primaryErr instanceof Error && primaryErr.message.includes("invalidfunction"))) {
      method = "grades";
      try {
        const report = await callMoodle("gradereport_user_get_grade_items", {
          courseid: courseId,
          userid: userId,
        }) as GradeReport;

        const derived = progressFromGrades(report);
        courseStatus = derived.courseStatus;
        progress = derived.progress;
        moodleStatus = courseStatus === "completed" ? "completed" : "enrolled";
      } catch (fallbackErr) {
        if (isAccessException(fallbackErr)) {
          return {
            ok: false,
            error:
              "The Moodle web service token lacks access. Add 'core_completion_get_course_completion_status' " +
              "(or 'gradereport_user_get_grade_items') to the web service in Moodle → Site admin → " +
              "Plugins → Web services → External services.",
          };
        }
        return { ok: false, error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr) };
      }
    } else {
      return { ok: false, error: primaryErr instanceof Error ? primaryErr.message : String(primaryErr) };
    }
  }

  await supabase
    .from("participant_trainings")
    .update({
      course_status: courseStatus,
      progress_percentage: progress,
      moodle_status: moodleStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pt.id);

  if (courseStatus === "completed") {
    await supabase
      .from("participants")
      .update({ moodle_enrolment_status: "completed", updated_at: new Date().toISOString() })
      .eq("id", pt.participant_id);
  }

  return { ok: true, method };
}

// Syncs all participant_trainings rows for a single participant
async function syncParticipant(
  supabase: ReturnType<typeof createAdminClient>,
  participantId: string
): Promise<{ synced: number; errors: number; errorMessages: string[] }> {
  const { data: rows } = await supabase
    .from("participant_trainings")
    .select("id, moodle_course_id, moodle_user_id, participant_id")
    .eq("participant_id", participantId)
    .not("moodle_user_id", "is", null)
    .not("moodle_course_id", "is", null);

  if (!rows?.length) {
    return { synced: 0, errors: 1, errorMessages: ["Participant has not been enrolled in Moodle yet"] };
  }

  let synced = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const row of rows) {
    const result = await syncRow(supabase, row);
    if (result.ok) {
      synced++;
    } else {
      errors++;
      if (result.error && !errorMessages.includes(result.error)) {
        errorMessages.push(result.error);
      }
    }
  }

  return { synced, errors, errorMessages };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") return err("Method not allowed", 405);

  let participantId: string | undefined;
  try {
    const body = await req.json();
    participantId = body?.participantId;
  } catch {
    return err("Invalid JSON body", 400);
  }

  const supabase = createAdminClient();

  try {
    if (participantId) {
      const result = await syncParticipant(supabase, participantId);
      if (result.synced === 0 && result.errors > 0) {
        return err(result.errorMessages[0] ?? "Sync failed", 422);
      }
      return ok(
        { synced: result.synced, errors: result.errors, errorMessages: result.errorMessages },
        `Synced ${result.synced} course(s)`
      );
    }

    // Bulk sync: fetch all distinct participants with enrolled courses
    const { data: allRows } = await supabase
      .from("participant_trainings")
      .select("participant_id")
      .not("moodle_user_id", "is", null)
      .not("moodle_course_id", "is", null);

    if (!allRows?.length) return ok({ synced: 0, errors: 0 }, "No participants to sync");

    // Deduplicate participant IDs
    const uniqueIds = [...new Set(allRows.map((r) => r.participant_id))];

    let totalSynced = 0;
    let totalErrors = 0;
    const allErrorMessages: string[] = [];

    for (const pid of uniqueIds) {
      const result = await syncParticipant(supabase, pid);
      totalSynced += result.synced;
      totalErrors += result.errors;
      for (const msg of result.errorMessages) {
        if (!allErrorMessages.includes(msg)) allErrorMessages.push(msg);
      }
    }

    return ok(
      { synced: totalSynced, errors: totalErrors, errorMessages: allErrorMessages },
      `Synced ${totalSynced} course enrollment(s) across ${uniqueIds.length} participant(s), ${totalErrors} error(s)`
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Sync failed", 502);
  }
});
