import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { ok, err } from "../_shared/response.ts";
import { callMoodle } from "../_shared/moodle.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const siteInfo = await callMoodle("core_webservice_get_site_info");
    return ok(siteInfo, "Moodle connection successful");
  } catch (e) {
    return err(e instanceof Error ? e.message : "Moodle connection failed", 502);
  }
});
