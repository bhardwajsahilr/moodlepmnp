import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { ok, err } from "../_shared/response.ts";
import { callMoodle } from "../_shared/moodle.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

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

function generatePassword(): string {
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

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return err("Method not allowed", 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return err("Invalid JSON body", 400); }

  const {
    last_name, first_name, middle_initial = "", sex,
    profession, office, position, municipality,
    lactating = false, pregnant = false, is_ip = false, ip_group = "",
    nlg_status = "", sbc_status = "", dqc_status = "", nphc_status = "",
    hcsc_status = "", se_status = "", ts_status = "", pms_status = "",
    email, mobile_number, imported_by,
  } = body;

  if (!last_name || !first_name || !email) return err("last_name, first_name, and email are required", 400);

  const supabase = createAdminClient();
  const password = generatePassword();
  const emailStr = (email as string).toLowerCase().trim();

  try {
    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: emailStr, password, email_confirm: true,
    });
    if (authErr) return err(`Auth user creation failed: ${authErr.message}`, 422);
    const userId = authData.user.id;

    // 2. Create profile
    await supabase.from("profiles").insert({
      id: userId, role: "participant",
      full_name: `${first_name} ${last_name}`, email: emailStr,
    });

    // 3. Create participant record (status defaults to 'approved')
    const { data: participant, error: partErr } = await supabase
      .from("participants")
      .insert({
        last_name, first_name, middle_initial, sex, profession, office,
        position, municipality, lactating, pregnant, is_ip, ip_group,
        nlg_status, sbc_status, dqc_status, nphc_status,
        hcsc_status, se_status, ts_status, pms_status,
        email: emailStr, mobile_number,
        status: "approved", approved_at: new Date().toISOString(),
        imported_by: imported_by ?? null, user_id: userId, moodle_password: password,
      })
      .select().single();

    if (partErr || !participant) {
      await supabase.auth.admin.deleteUser(userId);
      return err(`Participant record creation failed: ${partErr?.message ?? "unknown"}`, 422);
    }

    const participantId = participant.id;

    // 4. Titles to enroll (status = "Yes")
    const titlesToEnroll: string[] = [];
    for (const { field, title } of TRAINING_STATUS_MAP) {
      if (body[field] === "Yes") titlesToEnroll.push(title);
    }

    // 5. Moodle
    const baseUrl = Deno.env.get("MOODLE_BASE_URL") ?? "";
    let moodleUserId: number | null = null;
    const enrollments: Array<{ trainingTitle: string; moodleCourseId: number; moodleCourseUrl: string }> = [];
    const failed: Array<{ trainingTitle: string; error: string }> = [];

    try {
      const result = await callMoodle("core_user_get_users", { criteria: [{ key: "email", value: emailStr }] }) as { users: Array<{ id: number }> };
      if (result?.users?.length > 0) moodleUserId = result.users[0].id;
    } catch { /* Moodle unreachable */ }

    if (moodleUserId === null) {
      try {
        const created = await callMoodle("core_user_create_users", {
          users: [{ username: emailStr, password, firstname: first_name as string, lastname: last_name as string, email: emailStr, auth: "manual" }],
        }) as Array<{ id: number }>;
        if (Array.isArray(created) && created[0]?.id) moodleUserId = created[0].id;
      } catch { /* Moodle unreachable */ }
    }

    if (moodleUserId && titlesToEnroll.length > 0) {
      const { data: mappings } = await supabase
        .from("course_mappings")
        .select("training_title, moodle_course_id, moodle_course_url")
        .in("training_title", titlesToEnroll);

      const roleId = Number(Deno.env.get("DEFAULT_MOODLE_ROLE_ID") ?? "5");

      for (const title of titlesToEnroll) {
        const mapping = (mappings ?? []).find((m) => m.training_title === title);
        if (!mapping?.moodle_course_id) { failed.push({ trainingTitle: title, error: `No Moodle course mapped for "${title}"` }); continue; }
        const moodleCourseId = Number(mapping.moodle_course_id);
        const moodleCourseUrl = mapping.moodle_course_url || `${baseUrl}/course/view.php?id=${moodleCourseId}`;
        try {
          await callMoodle("enrol_manual_enrol_users", { enrolments: [{ roleid: roleId, userid: moodleUserId, courseid: moodleCourseId }] });
          const { data: existing } = await supabase.from("participant_trainings").select("id").eq("participant_id", participantId).eq("training_title", title).maybeSingle();
          if (existing) {
            await supabase.from("participant_trainings").update({ moodle_course_id: String(moodleCourseId), moodle_course_url: moodleCourseUrl, moodle_user_id: String(moodleUserId), moodle_status: "enrolled", updated_at: new Date().toISOString() }).eq("id", existing.id);
          } else {
            await supabase.from("participant_trainings").insert({ participant_id: participantId, training_title: title, moodle_course_id: String(moodleCourseId), moodle_course_url: moodleCourseUrl, moodle_user_id: String(moodleUserId), moodle_status: "enrolled", course_status: "not_started", progress_percentage: 0 });
          }
          enrollments.push({ trainingTitle: title, moodleCourseId, moodleCourseUrl });
        } catch (e) { failed.push({ trainingTitle: title, error: e instanceof Error ? e.message : String(e) }); }
      }
    }

    if (moodleUserId) {
      await supabase.from("participants").update({ moodle_user_id: String(moodleUserId), moodle_enrolment_status: enrollments.length > 0 ? "enrolled" : "user_created", moodle_password: null }).eq("id", participantId);
    }

    return ok({ participantId, userId, email: emailStr, temporaryPassword: password, moodleUserId, enrollments, failed: failed.length > 0 ? failed : undefined }, `Participant created and ${enrollments.length} course(s) enrolled`);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Import failed", 502);
  }
});
