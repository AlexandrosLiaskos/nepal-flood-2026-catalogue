import { sourceFileResponse } from "../../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/schemas/under_review.schema.json", "application/schema+json; charset=utf-8", "under_review.schema.json");
}
