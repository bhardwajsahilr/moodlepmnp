export interface MoodleError {
  exception: string;
  errorcode: string;
  message: string;
  debuginfo?: string;
}

/**
 * Flattens a params object into Moodle-compatible URLSearchParams.
 * Moodle expects: users[0][username], values[0], etc.
 * Using manual serialization to ensure literal brackets (not %5B/%5D).
 */
function flattenParams(
  obj: Record<string, unknown>,
  prefix = "",
  parts: string[] = []
): string[] {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        const indexedKey = `${fullKey}[${i}]`;
        if (item !== null && typeof item === "object") {
          flattenParams(item as Record<string, unknown>, indexedKey, parts);
        } else {
          parts.push(`${encodeURIComponent(indexedKey)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (value !== null && typeof value === "object") {
      flattenParams(value as Record<string, unknown>, fullKey, parts);
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

export async function callMoodle(
  wsfunction: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const baseUrl = Deno.env.get("MOODLE_BASE_URL");
  const token = Deno.env.get("MOODLE_TOKEN");

  if (!baseUrl || !token) {
    throw new Error("Moodle environment variables not configured");
  }

  const baseParts = [
    `wstoken=${encodeURIComponent(token)}`,
    `wsfunction=${encodeURIComponent(wsfunction)}`,
    `moodlewsrestformat=json`,
  ];

  const paramParts = flattenParams(params);
  const body = [...baseParts, ...paramParts].join("&");

  const response = await fetch(
    `${baseUrl}/webservice/rest/server.php`,
    {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  if (!response.ok) {
    throw new Error(`Moodle HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data && typeof data === "object" && "exception" in data) {
    const e = data as MoodleError;
    const detail = e.debuginfo ? ` (${e.debuginfo})` : "";
    throw new Error(`Moodle [${e.errorcode}]: ${e.message}${detail}`);
  }

  return data;
}
