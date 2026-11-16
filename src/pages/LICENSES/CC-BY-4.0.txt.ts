import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("LICENSES/CC-BY-4.0.txt", "text/plain; charset=utf-8", "CC-BY-4.0.txt");
}
