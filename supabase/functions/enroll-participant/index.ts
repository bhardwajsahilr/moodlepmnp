import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { ok, err } from "../_shared/response.ts";
import { callMoodle } from "../_shared/moodle.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

const STATUS_FIELD_MAP: Record<string, string> = {
  NLG: "nlg_status", SBC: "sbc_status", DQC: "dqc_status",
  NPHC: "nphc_status", HCSC: "hcsc_status", SE: "se_status",
  TS: "ts_status", PMS: "pms_status",
};

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return err("Method not allowed", 405);

  let body: { participantId: string; trainingTitle: string; status: string };
  try { body = await req.json(); } catch { return err("Invalid JSON body", 400); }

  const { participantId, trainingTitle, status } = body;
  if (!participantId || !trainingTitle || !status) return err("participantId, trainingTitle, and status are required", 400);

  const supabase = createAdminClient();

  try {
    const { data: participant, error: pErr } = await supabase.from("participants").select("*").eq("id", participantId).maybeSingle();
    if (pErr || !participant) return err("Participant not found", 404);

    const statusField = STATUS_FIELD_MAP[trainingTitle.toUpperCase()];
    if (statusField) {
      await supabase.from("participants").update({ [statusField]: status, updated_at: new Date().toISOString() }).eq("id", participantId);
    }

    if (status !== "Yes") return ok({ participantId, trainingTitle, status, enrolled: false }, "Status updated");

    const baseUrl = Deno.env.get("MOODLE_BASE_URL") ?? "";
    const roleId = Number(Deno.env.get("DEFAULT_MOODLE_ROLE_ID") ?? "5");

    const { data: mapping } = await supabase.from("course_mappings").select("moodle_course_id, moodle_course_url").eq("training_title", trainingTitle).maybeSingle();
    if (!mapping?.moodle_course_id) return ok({ participantId, trainingTitle, status, enrolled: false }, `No Moodle course mapped for "${trainingTitle}"`);

    const moodleCourseId = Number(mapping.moodle_course_id);
    const moodleCourseUrl = mapping.moodle_course_url || `${baseUrl}/course/view.php?id=${moodleCourseId}`;

    let moodleUserId: number | null = participant.moodle_user_id ? Number(participant.moodle_user_id) : null;

    if (!moodleUserId) {
      const email = participant.email.toLowerCase().trim();
      try {
        const result = await callMoodle("core_user_get_users", { criteria: [{ key: "email", value: email }] }) as { users: Array<{ id: number }> };
        if (result?.users?.length > 0) moodleUserId = result.users[0].id;
      } catch { /* ignore */ }

      if (!moodleUserId && participant.moodle_password) {
        try {
          const created = await callMoodle("core_user_create_users", { users: [{ username: email, password: participant.moodle_password, firstname: participant.first_name, lastname: participant.last_name, email, auth: "manual" }] }) as Array<{ id: number }>;
          if (Array.isArray(created) && created[0]?.id) moodleUserId = created[0].id;
        } catch { /* ignore */ }
      }

      if (moodleUserId) {
        await supabase.from("participants").update({ moodle_user_id: String(moodleUserId), moodle_enrolment_status: "user_created", moodle_password: null, updated_at: new Date().toISOString() }).eq("id", participantId);
      }
    }

    if (!moodleUserId) return ok({ participantId, trainingTitle, status, enrolled: false }, "Status updated but Moodle user could not be created");

    try {
      await callMoodle("enrol_manual_enrol_users", { enrolments: [{ roleid: roleId, userid: moodleUserId, courseid: moodleCourseId }] });
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
      if (!msg.includes("message was not sent") && !msg.includes("mail") && !msg.includes("smtp")) throw e;
    }

    const { data: existing } = await supabase.from("participant_trainings").select("id").eq("participant_id", participantId).eq("training_title", trainingTitle).maybeSingle();
    if (existing) {
      await supabase.from("participant_trainings").update({ moodle_course_id: String(moodleCourseId), moodle_course_url: moodleCourseUrl, moodle_user_id: String(moodleUserId), moodle_status: "enrolled", updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("participant_trainings").insert({ participant_id: participantId, training_title: trainingTitle, moodle_course_id: String(moodleCourseId), moodle_course_url: moodleCourseUrl, moodle_user_id: String(moodleUserId), moodle_status: "enrolled", course_status: "not_started", progress_percentage: 0 });
    }

    await supabase.from("participants").update({ moodle_enrolment_status: "enrolled", updated_at: new Date().toISOString() }).eq("id", participantId);
    return ok({ participantId, trainingTitle, status, enrolled: true, moodleUserId, moodleCourseId, moodleCourseUrl }, "Enrolled successfully");
  } catch (e) {
    return err(e instanceof Error ? e.message : "Enrollment failed", 502);
  }
});
