import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
export async function GET() {
  return new Response(await readFile(resolve(process.cwd(), "catalogue/asset_reviews.json")), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
