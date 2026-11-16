import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("CITATION.cff", "text/yaml; charset=utf-8", "CITATION.cff");
}
