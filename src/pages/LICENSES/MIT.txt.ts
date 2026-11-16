import { sourceFileResponse } from "../../lib/responses";

export const prerender = true;

export function GET() {
  return sourceFileResponse("LICENSES/MIT.txt", "text/plain; charset=utf-8", "MIT.txt");
}
