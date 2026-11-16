import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/search_runs.csv", "text/csv; charset=utf-8", "search_runs.csv");
}
