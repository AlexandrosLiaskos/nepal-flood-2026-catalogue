import { sourceFileResponse } from "../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("LICENSE.md", "text/markdown; charset=utf-8", "LICENSE.md");
}
