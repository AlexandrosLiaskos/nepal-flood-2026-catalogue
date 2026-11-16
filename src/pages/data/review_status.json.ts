import { getPublicData } from "../../lib/data";
import { jsonResponse } from "../../lib/responses";

export const prerender = true;

export async function GET() {
  const { status } = await getPublicData();
  return jsonResponse(status, "review_status.json");
}
