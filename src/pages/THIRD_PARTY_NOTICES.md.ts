import { sourceFileResponse } from "../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("THIRD_PARTY_NOTICES.md", "text/markdown; charset=utf-8", "THIRD_PARTY_NOTICES.md");
}
