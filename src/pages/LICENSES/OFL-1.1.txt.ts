import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("LICENSES/OFL-1.1.txt", "text/plain; charset=utf-8", "OFL-1.1.txt");
}
