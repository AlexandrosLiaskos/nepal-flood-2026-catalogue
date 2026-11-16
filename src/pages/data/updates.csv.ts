import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/updates.csv", "text/csv; charset=utf-8", "updates.csv");
}
