import { getPublicData, parseBoundingBox } from "../../lib/data";
import { splitValues } from "../../lib/format";
import { jsonResponse } from "../../lib/responses";

export const prerender = true;

export async function GET() {
  const { resources, status } = await getPublicData();
  const features = resources.flatMap((resource) => {
    const bbox = parseBoundingBox(resource.bbox_wgs84);
    if (!bbox) return [];
    const [west, south, east, north] = bbox;
    return [{
      type: "Feature" as const,
      id: resource.resource_id,
      bbox,
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ]],
      },
      properties: {
        resource_id: resource.resource_id,
        title: resource.canonical_title,
        provider: resource.provider,
        resource_type: resource.resource_type,
        evidence_class: resource.evidence_class,
        thematic_categories: splitValues(resource.thematic_categories),
        temporal_role: resource.temporal_role,
        access_tier: resource.access_tier,
        licence: resource.license_spdx,
        landing_url: resource.landing_url,
        catalogue_status: resource.current_status,
      },
    }];
  });
  return jsonResponse({
    type: "FeatureCollection",
    catalogue_schema_version: status.schema_version,
    status_as_of: status.status_as_of,
    crs_note: "Coordinates are longitude and latitude in WGS84 (OGC:CRS84 axis order).",
    features,
  }, "spatial_resources.geojson");
}
