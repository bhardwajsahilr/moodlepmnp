import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { ok, err } from "../_shared/response.ts";
import { callMoodle } from "../_shared/moodle.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") return err("Method not allowed", 405);

  let participantId: string;
  let targetUrl: string | undefined;
  try {
    const body = await req.json();
    participantId = body?.participantId;
    targetUrl = body?.targetUrl;
    if (!participantId) return err("participantId is required", 400);
  } catch {
    return err("Invalid JSON body", 400);
  }

  try {
    const supabase = createAdminClient();

    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .select("email, moodle_user_id, moodle_enrolment_status")
      .eq("id", participantId)
      .maybeSingle();

    if (pErr || !participant) return err("Participant not found", 404);
    if (!participant.email) return err("Participant has no email address", 422);

    // Build the wantsurl redirect — defaults to Moodle dashboard if no targetUrl given
    const baseUrl = Deno.env.get("MOODLE_BASE_URL") ?? "";
    const redirectUrl = targetUrl ?? `${baseUrl}/my/`;
    const wantsUrl = encodeURIComponent(redirectUrl);

    // Attempt auth_userkey SSO (requires auth_userkey plugin on Moodle)
    try {
      const result = await callMoodle("auth_userkey_create_user_key", {
        params: [{ name: "email", value: participant.email.toLowerCase().trim() }],
      }) as { loginurl?: string };

      if (!result?.loginurl) {
        throw new Error("auth_userkey returned no loginurl");
      }

      // Append wantsurl redirect so Moodle lands on the right course
      const loginUrl = `${result.loginurl}&wantsurl=${wantsUrl}`;
      return ok({ loginUrl, method: "userkey" }, "Auto-login URL generated");
    } catch (keyErr) {
      const msg = keyErr instanceof Error ? keyErr.message.toLowerCase() : "";

      // If the plugin isn't installed or the token lacks the capability, fall back gracefully
      const isPluginMissing =
        msg.includes("invalidfunction") ||
        msg.includes("does not exist") ||
        msg.includes("not found") ||
        msg.includes("accessdenied") ||
        msg.includes("nopermissions");

      if (isPluginMissing) {
        // Fall back: send to Moodle login page with wantsurl so after manual login
        // Moodle redirects the user straight to the target course.
        const loginPageUrl = `${baseUrl}/login/index.php?wantsurl=${wantsUrl}`;
        return ok(
          { loginUrl: loginPageUrl, method: "direct", warning: "auth_userkey plugin not available on this Moodle; falling back to login page" },
          "Login page URL returned (auth_userkey not available)"
        );
      }

      throw keyErr;
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : "Auto-login generation failed", 502);
  }
});
