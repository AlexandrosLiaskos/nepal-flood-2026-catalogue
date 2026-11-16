import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/candidates.csv", "text/csv; charset=utf-8", "candidates.csv");
}
