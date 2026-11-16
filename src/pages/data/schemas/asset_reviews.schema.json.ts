import { sourceFileResponse } from "../../../lib/responses";
export const prerender = true;
export function GET() {
  return sourceFileResponse("catalogue/schemas/asset_reviews.schema.json", "application/schema+json; charset=utf-8", "asset_reviews.schema.json");
}
