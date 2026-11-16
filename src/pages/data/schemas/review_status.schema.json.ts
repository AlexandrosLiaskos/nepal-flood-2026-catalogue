import { sourceFileResponse } from "../../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/schemas/review_status.schema.json", "application/schema+json; charset=utf-8", "review_status.schema.json");
}
