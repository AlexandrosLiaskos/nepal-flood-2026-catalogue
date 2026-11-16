import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/candidate_assets.csv", "text/csv; charset=utf-8", "candidate_assets.csv");
}
