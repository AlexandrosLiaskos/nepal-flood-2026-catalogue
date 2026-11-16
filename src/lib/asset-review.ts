import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface MetadataField {
  value: unknown;
  state: string;
  source?: number;
  locator?: string;
}
export interface CatalogueAssessment {
  eligibility_outcome?: string;
  specific_decision?: string;
  reason?: string;
  information_role?: string;
  scientific_validation?: string;
  assessment_date?: string;
  source_evidence?: string | string[];
  metadata_corrections?: string;
  access_assessment?: string;
  rights_assessment?: string;
}
export interface AssetReview {
  asset_id: string;
  parent_id: string;
  title: string;
  source_url: string;
  reviewed_at: string;
  screening_disposition: string;
  asset_role: string;
  temporal_assessment: string;
  inspection_state: string;
  needs_follow_up: boolean;
  access: { result: string; route: string; checked_at: string | null; method: string; http_status: number | null };
  sources: string[];
  fields: Record<string, MetadataField>;
  limitations: string[];
  follow_up: { code: string; action: string }[];
  same_url_asset_ids: string[];
  assessment?: CatalogueAssessment;
}
export interface ReviewSummary {
  scope_asset_count: number;
  screened_assets: number;
  metadata_records_reviewed: number;
  assets_needing_follow_up: number;
  assets_without_recorded_follow_up: number;
  as_of: string;
  url_checks_complete: boolean;
  dispositions: Record<string, number>;
  access_results: Record<string, number>;
  issue_counts: Record<string, number>;
}
let promise: Promise<{ summary: ReviewSummary; assets: AssetReview[]; byId: Map<string, AssetReview> }>;
export function getAssetReviews() {
  return promise ??= readFile(resolve(process.cwd(), "catalogue/asset_reviews.json"), "utf8").then((text) => {
    const data = JSON.parse(text) as { summary: ReviewSummary; assets: AssetReview[] };
    if (data.assets.length !== data.summary.scope_asset_count) {
      throw new Error("Asset review register is incomplete");
    }
    const byId = new Map(data.assets.map((r) => [r.asset_id, r]));
    if (byId.size !== data.assets.length) throw new Error("Duplicate asset review");
    return { ...data, byId };
  });
}
export function canOpenReviewedAsset(review: AssetReview | undefined): boolean {
  return !!review && !["do_not_use_download_route", "retain_retracted_product", "retain_mixed_validity_package", "exclude_interface_asset"].includes(review.screening_disposition)
    && (review.access.result === "reachable_without_authentication" || (review.access.route === "free_registration" && ["access_denied", "authentication_required", "registration_required_as_documented", "reachable_without_authentication"].includes(review.access.result)));
}
export function reviewedAssetAccessLabel(review: AssetReview): string {
  if (review.access.route === "free_registration") return "Free registration required";
  if (review.access.route === "provider_application") return "Provider application required";
  if (review.access.route === "restricted_authorization" || review.access.result === "restricted_authorization") return "Authorization required";
  if (review.access.result === "reachable_without_authentication") return "Public access route";
  if (review.access.result === "authentication_required") return "Authentication required";
  return "Access not verified";
}
export const dispositionLabels: Record<string, string> = {
  retain_data_candidate: "Data candidate",
  retain_baseline_candidate: "Baseline candidate",
  retain_supporting_asset: "Supporting asset",
  retain_linked_manifestation: "Linked manifestation",
  retain_cloud_obscured_product: "Cloud-obscured water product",
  do_not_use_download_route: "Download route not usable",
  needs_follow_up: "Follow-up needed",
  retain_modelled_product: "Modelled product",
  retain_retracted_product: "Retracted product — historical record",
  retain_mixed_validity_package: "Package includes retracted products",
  exclude_interface_asset: "Interface support — excluded from scientific assets",
};
export const displayValue = (value: unknown): string => value === null || value === undefined ? "Not stated"
  : typeof value === "string" ? value : JSON.stringify(value);
export function reviewedAssetDispositionLabel(review: AssetReview): string {
  if (["include", "included"].includes(review.assessment?.eligibility_outcome ?? "")) {
    if (review.screening_disposition === "retain_data_candidate") return "Included data";
    if (review.screening_disposition === "retain_baseline_candidate") return "Included baseline";
  }
  return dispositionLabels[review.screening_disposition] ?? review.screening_disposition.replaceAll("_", " ");
}

export type AssetTier = "primary" | "auxiliary";

export function isPrimaryScientificAsset(review: AssetReview | undefined, assetType?: string, fileFormat?: string): boolean {
  if (review) {
    const role = review.asset_role;
    if (["preview_or_illustration", "metadata_or_documentation", "quality_or_auxiliary_layer", "empty_product_placeholder", "interface_support"].includes(role)) {
      return false;
    }
    if (["data_or_data_bearing_product", "baseline_reference_layer", "observational_data", "administrative_road_record", "modelled_product", "source_data_access_route", "method_evaluation_evidence", "source_code"].includes(role)) {
      return true;
    }
  }

  const fmt = (fileFormat || "").trim().toLowerCase();
  if (["png", "jpeg", "jpg"].includes(fmt) && (assetType?.includes("preview") || assetType?.includes("thumbnail"))) {
    return false;
  }
  if (["xml", "yaml", "parquet"].includes(fmt) && !assetType?.includes("data")) {
    return false;
  }

  const typeStr = (assetType || "").toLowerCase();
  if (typeStr.includes("preview") || typeStr.includes("thumbnail") || typeStr.includes("metadata") || typeStr.includes("quality_or_exclusion") || typeStr.includes("quality_or_context")) {
    return false;
  }

  return true;
}

export interface HazardDomain {
  id: string;
  label: string;
  shortLabel: string;
}

export const HAZARD_DOMAINS: Record<string, HazardDomain> = {
  seismicity: { id: "seismicity", label: "Seismicity & Geohazards", shortLabel: "Seismicity" },
  terrain: { id: "terrain", label: "Terrain & Elevation", shortLabel: "Terrain" },
  cryosphere_source: { id: "cryosphere_source", label: "Cryosphere & Glaciers", shortLabel: "Cryosphere" },
  radar_sar: { id: "radar_sar", label: "Radar & SAR Remote Sensing", shortLabel: "Radar (SAR)" },
  optical_eo: { id: "optical_eo", label: "Optical Remote Sensing", shortLabel: "Optical EO" },
  infrastructure_impacts: { id: "infrastructure_impacts", label: "Infrastructure & Exposure", shortLabel: "Infrastructure" },
  hydrology_flood: { id: "hydrology_flood", label: "Hydrology & Floods", shortLabel: "Hydrology" },
  preprints: { id: "preprints", label: "Scientific Preprints", shortLabel: "Preprint" },
  reports_synthesis: { id: "reports_synthesis", label: "Situation Reports & Updates", shortLabel: "Report" },
  reference_vector: { id: "reference_vector", label: "Reference Vector Data", shortLabel: "Vector Data" },
  general_evidence: { id: "general_evidence", label: "Geospatial Data", shortLabel: "Data" },
};

function hasWord(text: string, words: string[]): boolean {
  return words.some((w) => {
    const regex = new RegExp(`(?:^|[^a-z0-9])${w}(?:[^a-z0-9]|$)`, "i");
    return regex.test(text);
  });
}

export function getHazardCascadeDomain(
  title: string,
  typeOrClass?: string,
  family?: string,
): HazardDomain {
  const t = (title || "").toLowerCase();
  const at = (typeOrClass || "").toLowerCase();
  const fam = (family || "").toLowerCase();
  const self = `${t} ${at}`;

  // 1. Scientific Preprints & Papers
  if (at === "manuscript" || fam.includes("preprint") || hasWord(self, ["preprint", "manuscript", "eartharxiv"])) {
    return HAZARD_DOMAINS.preprints;
  }

  // 2. Situation Reports & Bulletins
  if (
    at === "report" ||
    at === "press_release" ||
    hasWord(t, ["sitrep", "bulletin"]) ||
    (hasWord(t, ["report", "situation update", "press release"]) && !hasWord(t, ["dem", "shapefile", "geojson", "geopackage", "imagery", "sar", "map", "interactive map"]))
  ) {
    return HAZARD_DOMAINS.reports_synthesis;
  }

  // 3. Seismicity & Geohazards (earthquakes, epicentres, fault lines, field surveys)
  if (
    hasWord(self, [
      "earthquake",
      "epicentres",
      "epicentre",
      "epicenters",
      "seismic",
      "seismicity",
      "fault",
      "faults",
      "landslide locations",
      "geohazard sites",
      "geohazard field surveys",
      "debris-flow comparison map",
      "disaster-site location",
    ]) ||
    at === "hazard_reference"
  ) {
    return HAZARD_DOMAINS.seismicity;
  }

  // 4. Terrain, Elevation & Environmental Baselines (DEMs, elevation models, contours, topography, land use, soils)
  if (
    hasWord(self, [
      "dem",
      "elevation",
      "topography",
      "topographic",
      "contour",
      "contours",
      "bathymetry",
      "bathymetric",
      "land use",
      "soil data",
    ]) ||
    at === "terrain_or_elevation" ||
    at.includes("soil_baseline")
  ) {
    return HAZARD_DOMAINS.terrain;
  }

  // 5. Cryosphere & Glaciers (glaciers, snow-cover, avalanches, ice)
  if (
    hasWord(self, ["glacier", "glaciers", "glacial", "snow", "ice", "avalanche", "avalanches", "glof", "moraine"]) ||
    at === "cryosphere" ||
    at.includes("cryosphere")
  ) {
    return HAZARD_DOMAINS.cryosphere_source;
  }

  // 6. Radar & SAR Remote Sensing (Sentinel-1, Chaohu-1/BC2, Gaofen-3/3B/3C, L-SAR/LT-1A, HJ-2E/2F, NISAR, interferograms)
  if (
    hasWord(self + " " + fam, [
      "sar",
      "radar",
      "sentinel-1",
      "chaohu",
      "chaohu-1",
      "bc2",
      "gf3",
      "gf-3",
      "gaofen-3",
      "gaofen-3b",
      "gaofen-3c",
      "l-sar",
      "l-sar 01a",
      "lt-1a",
      "lt1a",
      "lutan",
      "hj-2e",
      "hj2e",
      "hj-2f",
      "hj2f",
      "nisar",
      "interferogram",
      "gunw",
      "rtc",
    ]) ||
    self.includes("gaofen-3") ||
    fam.includes("gaofen-3") ||
    self.includes("l-sar") ||
    fam.includes("l-sar") ||
    self.includes("lt-1a") ||
    fam.includes("lt-1a") ||
    self.includes("hj-2e") ||
    fam.includes("hj-2e") ||
    self.includes("hj-2f") ||
    fam.includes("hj-2f")
  ) {
    return HAZARD_DOMAINS.radar_sar;
  }

  // 7. Optical Remote Sensing (PlanetScope, SkySat, orthophotos, Sentinel-2, Landsat, CBERS, Gaofen-1/2/4/6/7, HJ-2A/B, ZY-1, Shenqi-02)
  if (
    hasWord(self + " " + fam, [
      "planet",
      "planetscope",
      "skysat",
      "orthophoto",
      "orthophotos",
      "sentinel-2",
      "landsat",
      "cbers",
      "gaofen",
      "gf1",
      "gf2",
      "gf4",
      "gf6",
      "gf7",
      "worldview",
      "jilin",
      "optical",
      "aerial",
      "shenqi",
      "bc5",
      "zy-1",
      "zy1",
      "hj-2a",
      "hj-2b",
      "modis",
    ]) ||
    at === "earth_observation_imagery_or_product" ||
    at === "satellite_imagery"
  ) {
    return HAZARD_DOMAINS.optical_eo;
  }

  // 8. Hydrology, River Network & Flood Inundation (gauges, discharge, water level, flood extents, waterways, barrier lakes, mudflows)
  // Evaluated BEFORE general infrastructure so river waterways and barrier lakes route to Hydrology
  if (
    hasWord(self, [
      "gauge",
      "gauges",
      "discharge",
      "water level",
      "water levels",
      "hydrology",
      "hydrological",
      "dswx",
      "gfm",
      "flood extent",
      "flood water",
      "inundation",
      "surface water",
      "waterway",
      "waterways",
      "river",
      "rivers",
      "chwrr",
      "dhm",
      "barrier-lake",
      "barrier lake",
      "mudflow and rockflow",
      "mudflow",
      "rockflow",
    ]) ||
    at === "hydrology_or_surface_water" ||
    at.includes("water_or_flood")
  ) {
    return HAZARD_DOMAINS.hydrology_flood;
  }

  // 9. Infrastructure, Buildings, Damage & Exposure (roads, bridges, buildings, settlements, population, damage grading)
  if (
    hasWord(self, [
      "road",
      "roads",
      "bridge",
      "bridges",
      "building",
      "buildings",
      "settlement",
      "settlements",
      "village",
      "villages",
      "highway",
      "highways",
      "infrastructure",
      "damage",
      "exposure",
      "population",
      "transport",
      "poi",
      "points of interest",
      "education",
      "health",
      "facilities",
      "census",
      "socioeconomic",
      "osm",
      "openstreetmap",
      "fair",
      "emsr",
      "emsr927",
      "grading",
      "hydropower",
      "blockages",
    ]) ||
    at.includes("exposure") ||
    at.includes("population")
  ) {
    return HAZARD_DOMAINS.infrastructure_impacts;
  }

  // 10. Reference Geography & Vector Data
  if (
    at.includes("vector") ||
    at.includes("geometry") ||
    hasWord(t, ["boundary", "boundaries", "location", "administrative", "reference layers", "all mapped layers"])
  ) {
    return HAZARD_DOMAINS.reference_vector;
  }

  return HAZARD_DOMAINS.general_evidence;
}
