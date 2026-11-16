import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/assets.csv", "text/csv; charset=utf-8", "assets.csv");
}
