import { getPublicData } from "../../lib/data";
import { splitValues } from "../../lib/format";
import { jsonResponse } from "../../lib/responses";

export const prerender = true;

export async function GET() {
  const { resources, assets, status } = await getPublicData();
  const output = {
    schema_version: status.schema_version,
    status_as_of: status.status_as_of,
    scope: "reviewed_catalogue_resources",
    reviewed_resource_count: resources.length,
    resources: resources.map((resource) => ({
      ...resource,
      thematic_categories: splitValues(resource.thematic_categories),
      metadata_source_urls: splitValues(resource.metadata_source_urls),
      assets: assets.filter((asset) => asset.resource_id === resource.resource_id),
    })),
  };
  return jsonResponse(output, "catalogue.json");
}
