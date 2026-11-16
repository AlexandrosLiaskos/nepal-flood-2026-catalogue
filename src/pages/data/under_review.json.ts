import { getPublicData } from "../../lib/data";
import { splitValues } from "../../lib/format";
import { jsonResponse } from "../../lib/responses";

export const prerender = true;

export async function GET() {
  const { candidates, candidateAssets, status } = await getPublicData();
  const output = {
    schema_version: status.schema_version,
    status_as_of: status.status_as_of,
    scope: "candidate_records_under_review",
    notice: "Candidates have not completed eligibility and metadata verification and are not reviewed catalogue resources.",
    candidate_record_count: candidates.length,
    candidate_asset_count: candidateAssets.length,
    candidates: candidates.map((candidate) => ({
      ...candidate,
      metadata_source_urls: splitValues(candidate.metadata_source_urls),
      assets: candidateAssets
        .filter((asset) => asset.record_id === candidate.record_id)
        .map((asset) => ({ ...asset, source_evidence_urls: splitValues(asset.source_evidence_urls) })),
    })),
  };
  return jsonResponse(output, "under_review.json");
}
