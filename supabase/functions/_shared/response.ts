import { corsHeaders } from "./cors.ts";

export function ok(data: unknown, message = "Success"): Response {
  return new Response(
    JSON.stringify({ success: true, message, data }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

export function err(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ success: false, message, data: null }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
