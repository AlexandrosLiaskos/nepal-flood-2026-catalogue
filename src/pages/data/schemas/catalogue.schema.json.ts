import { sourceFileResponse } from "../../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("catalogue/schemas/catalogue.schema.json", "application/schema+json; charset=utf-8", "catalogue.schema.json");
}
