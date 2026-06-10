import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { ok, err } from "../_shared/response.ts";
import { callMoodle } from "../_shared/moodle.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

// Maps each per-field status column to its training title abbreviation
const TRAINING_STATUS_MAP: Array<{ field: string; title: string }> = [
  { field: "nlg_status", title: "NLG" },
  { field: "sbc_status", title: "SBC" },
  { field: "dqc_status", title: "DQC" },
  { field: "nphc_status", title: "NPHC" },
  { field: "hcsc_status", title: "HCSC" },
  { field: "se_status", title: "SE" },
  { field: "ts_status", title: "TS" },
  { field: "pms_status", title: "PMS" },
];

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#$!";
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base =
    rand(upper) + rand(upper) + rand(upper) +
    rand(lower) + rand(lower) + rand(lower) +
    rand(digits) + rand(digits) +
    rand(special);
  return base.split("").sort(() => Math.random() - 0.5).join("");
}

interface EnrolmentOutcome {
  trainingTitle: string;
  moodleCourseId: number;
  moodleCourseUrl: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return err("Method not allowed", 405);
  }

  let participantId: string;
  try {
    const body = await req.json();
    participantId = body?.participantId;
    if (!participantId) return err("participantId is required", 400);
  } catch {
    return err("Invalid JSON body", 400);
  }

  const supabase = createAdminClient();

  try {
    // 1. Fetch participant
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .select("*")
      .eq("id", participantId)
      .maybeSingle();

    if (pErr || !participant) return err("Participant not found", 404);
    if (participant.status === "approved") {
      return err("Participant is already approved", 409);
    }

    // 2. Determine which training titles need Moodle enrollment (status = "Yes")
    const titlesToEnroll: string[] = [];
    for (const { field, title } of TRAINING_STATUS_MAP) {
      if ((participant as Record<string, unknown>)[field] === "Yes") {
        titlesToEnroll.push(title);
      }
    }

    // Fall back to legacy single training_title if no per-field statuses are set to "Yes"
    if (titlesToEnroll.length === 0 && participant.training_title) {
      titlesToEnroll.push(participant.training_title);
    }

    // 3. Load course mappings for relevant titles in one query
    let courseMappings: Array<{
      id: string;
      training_title: string;
      moodle_course_id: string;
      moodle_course_url: string;
    }> = [];

    if (titlesToEnroll.length > 0) {
      const { data: mappings } = await supabase
        .from("course_mappings")
        .select("id, training_title, moodle_course_id, moodle_course_url")
        .in("training_title", titlesToEnroll);
      courseMappings = mappings ?? [];
    }

    const baseUrl = Deno.env.get("MOODLE_BASE_URL") ?? "";

    // 4. Check / create Moodle user (once, shared across all enrollments)
    let moodleUserId: number | null = null;

    if (participant.moodle_user_id) {
      moodleUserId = Number(participant.moodle_user_id);
    } else {
      const email = participant.email.toLowerCase().trim();
      let existingUsers: Array<{ id: number }> = [];
      try {
        const result = await callMoodle("core_user_get_users", {
          criteria: [{ key: "email", value: email }],
        }) as { users: Array<{ id: number }> };
        existingUsers = result?.users ?? [];
      } catch (e) {
        throw new Error(`Step 1 (lookup user): ${e instanceof Error ? e.message : e}`);
      }

      if (existingUsers.length > 0) {
        moodleUserId = existingUsers[0].id;
      }
    }

    if (!moodleUserId) {
      const email = participant.email.toLowerCase().trim();
      // Use email as the Moodle username so login credentials match the portal
      const username = email;
      // Use the password stored at registration; fall back to a generated one if missing
      const password = participant.moodle_password ?? generateTempPassword();

      let created: Array<{ id: number }> = [];
      try {
        created = await callMoodle("core_user_create_users", {
          users: [
            {
              username,
              password,
              firstname: participant.first_name,
              lastname: participant.last_name,
              email,
              auth: "manual",
            },
          ],
        }) as Array<{ id: number }>;
      } catch (e) {
        throw new Error(`Step 2 (create user "${username}"): ${e instanceof Error ? e.message : e}`);
      }

      if (!Array.isArray(created) || !created[0]?.id) {
        throw new Error("Step 2: Moodle user creation returned unexpected response");
      }

      moodleUserId = created[0].id;

      // Clear stored password now that the Moodle account has been created
      await supabase
        .from("participants")
        .update({
          moodle_user_id: String(moodleUserId),
          moodle_enrolment_status: "user_created",
          moodle_password: null,
        })
        .eq("id", participantId);
    }

    // 5. Enroll into each course where status = "Yes"
    const roleId = Number(Deno.env.get("DEFAULT_MOODLE_ROLE_ID") ?? "5");
    const now = new Date().toISOString();
    const outcomes: EnrolmentOutcome[] = [];

    for (const title of titlesToEnroll) {
      const mapping = courseMappings.find((m) => m.training_title === title);

      if (!mapping?.moodle_course_id) {
        outcomes.push({
          trainingTitle: title,
          moodleCourseId: 0,
          moodleCourseUrl: "",
          success: false,
          error: `No Moodle course mapped for "${title}"`,
        });
        continue;
      }

      const moodleCourseId = Number(mapping.moodle_course_id);
      const moodleCourseUrl =
        mapping.moodle_course_url || `${baseUrl}/course/view.php?id=${moodleCourseId}`;

      // 5a. Verify course exists in Moodle
      try {
        const courses = await callMoodle("core_course_get_courses", {
          options: { ids: [moodleCourseId] },
        }) as Array<{ id: number }>;
        if (!Array.isArray(courses) || courses.length === 0) {
          throw new Error(`Course ID ${moodleCourseId} does not exist in Moodle`);
        }
      } catch (e) {
        outcomes.push({
          trainingTitle: title,
          moodleCourseId,
          moodleCourseUrl,
          success: false,
          error: `Course verify failed: ${e instanceof Error ? e.message : e}`,
        });
        continue;
      }

      // 5b. Enrol user
      let enrolError: Error | null = null;
      try {
        await callMoodle("enrol_manual_enrol_users", {
          enrolments: [{ roleid: roleId, userid: moodleUserId, courseid: moodleCourseId }],
        });
      } catch (e) {
        enrolError = e instanceof Error ? e : new Error(String(e));
      }

      if (enrolError) {
        const msg = enrolError.message.toLowerCase();
        const isNotificationError =
          msg.includes("message was not sent") ||
          msg.includes("could not send") ||
          msg.includes("mail") ||
          msg.includes("smtp");

        if (!isNotificationError) {
          outcomes.push({
            trainingTitle: title,
            moodleCourseId,
            moodleCourseUrl,
            success: false,
            error: `Enrol failed: ${enrolError.message}`,
          });
          continue;
        }
        // Notification-only errors: Moodle enrolled the user but couldn't send the welcome email.
        // This is a Moodle SMTP misconfiguration, not an enrollment failure — treat as success.
      }

      // 5c. Upsert participant_trainings row for this course
      const { data: existingPt } = await supabase
        .from("participant_trainings")
        .select("id")
        .eq("participant_id", participantId)
        .eq("training_title", title)
        .maybeSingle();

      if (existingPt) {
        await supabase
          .from("participant_trainings")
          .update({
            moodle_course_id: String(moodleCourseId),
            moodle_course_url: moodleCourseUrl,
            moodle_user_id: String(moodleUserId),
            moodle_status: "enrolled",
            updated_at: now,
          })
          .eq("id", existingPt.id);
      } else {
        await supabase.from("participant_trainings").insert({
          participant_id: participantId,
          training_title: title,
          moodle_course_id: String(moodleCourseId),
          moodle_course_url: moodleCourseUrl,
          moodle_user_id: String(moodleUserId),
          moodle_status: "enrolled",
          course_status: "not_started",
          progress_percentage: 0,
        });
      }

      outcomes.push({ trainingTitle: title, moodleCourseId, moodleCourseUrl, success: true });
    }

    // 6. Mark participant as approved regardless of individual enrollment outcomes
    const anyEnrolled = outcomes.some((o) => o.success);
    await supabase
      .from("participants")
      .update({
        status: "approved",
        approved_at: now,
        moodle_user_id: String(moodleUserId),
        moodle_enrolment_status: anyEnrolled ? "enrolled" : "user_created",
        updated_at: now,
      })
      .eq("id", participantId);

    const successEnrollments = outcomes.filter((o) => o.success);
    const failedEnrollments = outcomes.filter((o) => !o.success);

    return ok(
      {
        participantId,
        moodleUserId,
        enrollments: successEnrollments.map((o) => ({
          trainingTitle: o.trainingTitle,
          moodleCourseId: o.moodleCourseId,
          moodleCourseUrl: o.moodleCourseUrl,
        })),
        // Legacy single-course fields for backward compatibility
        moodleCourseId: successEnrollments[0]?.moodleCourseId ?? 0,
        moodleCourseUrl: successEnrollments[0]?.moodleCourseUrl ?? "",
        failed: failedEnrollments.map((o) => ({ trainingTitle: o.trainingTitle, error: o.error })),
      },
      failedEnrollments.length === 0
        ? `Participant approved and enrolled in ${successEnrollments.length} course(s)`
        : `Participant approved. ${successEnrollments.length} enrollment(s) succeeded, ${failedEnrollments.length} failed`
    );
  } catch (e) {
    await supabase
      .from("participants")
      .update({ moodle_enrolment_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", participantId);

    return err(e instanceof Error ? e.message : "Approval workflow failed", 502);
  }
});
