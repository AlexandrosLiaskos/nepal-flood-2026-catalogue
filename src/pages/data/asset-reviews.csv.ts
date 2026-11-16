import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
export async function GET() {
  return new Response(await readFile(resolve(process.cwd(), "catalogue/asset_reviews.csv")), { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}
