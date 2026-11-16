import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dataHeaders = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
};

export async function sourceFileResponse(source: string, contentType: string, filename?: string): Promise<Response> {
  const content = await readFile(resolve(process.cwd(), source));
  return new Response(content, {
    headers: {
      ...dataHeaders,
      "Content-Type": contentType,
      ...(filename ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
    },
  });
}

export function jsonResponse(data: unknown, filename?: string): Response {
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    headers: {
      ...dataHeaders,
      "Content-Type": "application/json; charset=utf-8",
      ...(filename ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
    },
  });
}
