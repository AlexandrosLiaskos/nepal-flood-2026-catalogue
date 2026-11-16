import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import { parse } from "csv-parse/sync";

const schemaVersion = z.literal("2.0.0");
const resourceIdentifier = z.string().regex(/^(?:(?:res-|rec_)[0-9a-f-]{36}|added_by_review_[A-Za-z0-9_-]+)$/);
const assetIdentifier = z.string().regex(/^(?:(?:ast-|acand_|added-)[0-9a-f-]{36}|added_by_review_[A-Za-z0-9_-]+)$/);
const httpUrl = z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://"));
const optionalText = z.string().transform((value) => value.trim() || null);
const optionalUrl = z.string().transform((value, context) => {
  const normalized = value.trim();
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Unsupported protocol");
    return parsed.toString();
  } catch {
    context.addIssue({ code: "custom", message: "Expected an HTTP or HTTPS URL" });
    return z.NEVER;
  }
});
const integer = z.coerce.number().int().nonnegative();
const optionalInteger = z.string().transform((value) => value.trim() ? Number(value) : null)
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), "Expected a nonnegative integer or a blank field");
const booleanText = z.enum(["true", "false"]).transform((value) => value === "true");

function csvLoader(fileName: string, idField: string) {
  return file(fileName, {
    parser: (content) =>
      parse(content, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        relax_column_count: false,
        trim: false,
      }).map((row: Record<string, string>) => ({ id: row[idField], ...row })),
  });
}

const resources = defineCollection({
  loader: csvLoader("catalogue/catalogue.csv", "resource_id"),
  schema: z.object({
    schema_version: schemaVersion,
    resource_id: resourceIdentifier,
    canonical_title: z.string().min(1),
    title_original: z.string().min(1),
    title_language: z.string().min(2),
    translation_status: z.enum(["confirmed", "under_review", "not_stated", "not_verified", "conflicting", "not_applicable"]),
    provider: z.string().min(1),
    resource_type: z.string().min(1),
    evidence_class: z.string().min(1),
    thematic_categories: z.string(),
    description: z.string(),
    publication_date: optionalText,
    last_updated: optionalText,
    resource_version: optionalText,
    persistent_identifier: optionalText,
    landing_url: httpUrl,
    language: z.string().min(1),
    geographic_scope: z.string(),
    bbox_wgs84: optionalText,
    temporal_start: optionalText,
    temporal_end: optionalText,
    temporal_role: z.string().min(1),
    access_tier: z.string().min(1),
    access_url: httpUrl,
    license_spdx: optionalText,
    license_url: optionalUrl,
    redistribution_status: z.string().min(1),
    production_method: z.string(),
    provenance_summary: z.string(),
    validation_status: z.string().min(1),
    uncertainty_summary: z.string(),
    limitations: z.string(),
    metadata_source_urls: z.string(),
    reviewed_on: z.string().date(),
    current_status: z.string().min(1),
    included_in_manuscript_version: optionalText,
  }),
});

const assets = defineCollection({
  loader: csvLoader("catalogue/assets.csv", "asset_id"),
  schema: z.object({
    schema_version: schemaVersion,
    asset_id: assetIdentifier,
    resource_id: resourceIdentifier,
    title: z.string().min(1),
    title_original: z.string().min(1),
    title_language: z.string().min(2),
    translation_status: z.enum(["confirmed", "under_review", "not_stated", "not_verified", "conflicting", "not_applicable"]),
    asset_type: z.string().min(1),
    dataset_family: z.string(),
    asset_url: httpUrl,
    host_or_aggregator: z.string(),
    listed_contributor: z.string(),
    normalized_contributors: z.string(),
    source_role: z.string(),
    upstream_source: z.string(),
    upstream_evidence_status: z.string(),
    relationship_to_resource: z.string(),
    provenance_status: z.string().min(1),
    media_type: z.string(),
    file_format: z.string(),
    size_bytes: integer,
    size_as_shown: z.string(),
    crs: z.string(),
    spatial_resolution: z.string(),
    temporal_start: optionalText,
    temporal_end: optionalText,
    temporal_role: z.string(),
    bbox_wgs84: optionalText,
    access_tier: z.string().min(1),
    access_checked_at: optionalText,
    license_spdx: optionalText,
    license_url: optionalUrl,
    rights_status: z.string().min(1),
    rights_note: z.string(),
    redistribution_status: z.string().min(1),
    method_status: z.string(),
    source_evidence_urls: z.string(),
    reviewed_on: z.string().date(),
    current_status: z.string().min(1),
    notes: z.string(),
  }),
});

const candidates = defineCollection({
  loader: csvLoader("catalogue/candidates.csv", "record_id"),
  schema: z.object({
    schema_version: schemaVersion,
    record_id: z.string().regex(/^rec_[0-9a-f-]{36}$/),
    display_title: z.string().min(1),
    title_original: z.string().min(1),
    translation_status: z.enum(["confirmed", "under_review", "not_stated", "not_verified", "conflicting", "not_applicable"]),
    source_name: z.string().min(1),
    source_role: z.string().min(1),
    record_type: z.string().min(1),
    landing_url: httpUrl,
    original_language: z.string().min(2),
    publication_date_as_shown: z.string().min(1),
    first_identified_at: z.string().datetime({ offset: true }),
    review_status: z.literal("under_review"),
    review_note: z.string().min(1),
    asset_count: integer,
    asset_total_size_bytes: integer,
    asset_total_size_as_shown: z.string().min(1),
    external_contributor_asset_count: integer,
    anonymous_reachable_asset_count: integer,
    unavailable_asset_count: integer,
    asset_bodies_downloaded: integer,
    collection_license_status: z.enum(["confirmed", "under_review", "not_stated", "not_verified", "conflicting", "not_applicable"]),
    redistribution_status: z.string().min(1),
    description: z.string().min(1),
    geographic_scope: z.string().min(1),
    temporal_scope: z.string().min(1),
    metadata_source_urls: z.string().min(1),
  }),
});

const candidateAssets = defineCollection({
  loader: csvLoader("catalogue/candidate_assets.csv", "candidate_asset_id"),
  schema: z.object({
    schema_version: schemaVersion,
    candidate_asset_id: z.string().regex(/^acand_[0-9a-f-]{36}$/),
    record_id: z.string().regex(/^rec_[0-9a-f-]{36}$/),
    position: integer,
    title_original: z.string().min(1),
    title_english: z.string(),
    translation_status: z.enum(["confirmed", "under_review", "not_stated", "not_verified", "conflicting", "not_applicable"]),
    host_aggregator: z.string().min(1),
    listed_contributor: z.string().min(1),
    normalized_contributors: z.string(),
    source_role: z.string(),
    upstream_source: z.string(),
    upstream_evidence_status: z.string(),
    relationship_to_parent: z.string(),
    platform_or_dataset_family: z.string(),
    content_class: z.string().min(1),
    temporal_role: z.string().min(1),
    acquisition_date_as_stated: z.string(),
    spatial_resolution_as_stated: z.string(),
    file_format: z.string(),
    size_bytes_as_stated: integer,
    size_as_shown: z.string().min(1),
    asset_url: httpUrl,
    access_status: z.enum(["reachable_without_authentication", "unavailable_at_check", "not_verified", "registration_required_as_documented", "restricted_authorization", "authentication_required", "access_denied", "invalid_source_uri", "known_invalid_archive", "unexpected_html_response"]),
    access_checked_at: z.string().datetime({ offset: true }),
    provenance_status: z.enum(["confirmed", "under_review", "not_stated", "not_verified", "conflicting", "not_applicable"]),
    rights_status: z.enum(["confirmed", "under_review", "not_stated", "not_verified", "conflicting", "not_applicable", "restrictive_notice_present", "stated_cc_by_4_0", "package_license_stated"]),
    rights_note: z.string().min(1),
    redistribution_status: z.string().min(1),
    method_status: z.string(),
    source_evidence_urls: z.string(),
    body_downloaded: booleanText,
    review_status: z.literal("under_review"),
  }),
});

const updates = defineCollection({
  loader: csvLoader("catalogue/updates.csv", "update_id"),
  schema: z.object({
    schema_version: schemaVersion,
    update_id: z.string().min(1),
    published_on: z.string().date(),
    update_type: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
  }),
});

const searchRuns = defineCollection({
  loader: csvLoader("catalogue/search_runs.csv", "run_id"),
  schema: z.object({
    schema_version: schemaVersion,
    run_id: z.string().regex(/^RUN-\d{8}-\d{3}$/),
    strategy_id: z.string(),
    search_name: z.string().min(1),
    searched_on: z.string().date(),
    status: z.enum(["completed", "partial", "unavailable"]),
    source_name: z.string().min(1),
    interface_name: z.string().min(1),
    interface_url: httpUrl,
    aim: z.string().min(1),
    exact_strategy: z.string().min(1),
    filters_and_criteria: z.string().min(1),
    coverage: z.string().min(1),
    stopping_rule: z.string().min(1),
    results_examined: optionalInteger,
    records_retrieved: optionalInteger,
    assets_listed: optionalInteger,
    record_ids: z.string(),
    result_summary: z.string().min(1),
    historical_claims_notice: z.string().default(""),
    register_field_provenance: z.string().default(""),
  }),
});

export const collections = { resources, assets, candidates, candidateAssets, updates, searchRuns };
