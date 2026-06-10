import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { ok, err } from "../_shared/response.ts";
import { callMoodle } from "../_shared/moodle.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const courses = await callMoodle("core_course_get_courses");
    return ok(courses, "Courses fetched successfully");
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to fetch courses", 502);
  }
});
