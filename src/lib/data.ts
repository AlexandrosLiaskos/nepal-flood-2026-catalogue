import { getCollection } from "astro:content";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "astro:content";
import type { PublicData, ReviewStatus } from "./types";

const reviewStatusSchema = z.object({
  schema_version: z.literal("2.0.0"),
  catalogue_status: z.literal("active"),
  status_as_of: z.string().date(),
  initial_cycle_started_on: z.string().date(),
  first_search_at: z.string().datetime({ offset: true }),
  last_search_at: z.string().datetime({ offset: true }),
  searches_complete_through: z.string().date().nullable(),
  manuscript_version: z.number().int().positive().nullable(),
  search_status: z.enum(["initial_search_programme_in_progress", "ongoing", "reduced_frequency", "retired"]),
  nomination_status: z.enum(["under_review", "open", "closed"]),
  reviewed_resources: z.number().int().nonnegative(),
  reviewed_assets: z.number().int().nonnegative(),
  included_resources: z.number().int().nonnegative(),
  candidate_records_under_review: z.number().int().nonnegative(),
  candidate_assets_under_review: z.number().int().nonnegative(),
  newly_eligible_awaiting_integration: z.number().int().nonnegative(),
});

let publicDataPromise: Promise<PublicData> | undefined;

function ensureUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function validateDateState(status: ReviewStatus): void {
  const first = Date.parse(status.first_search_at);
  const last = Date.parse(status.last_search_at);
  const statusDayEnd = Date.parse(`${status.status_as_of}T23:59:59.999Z`);
  if (first > last) throw new Error("first_search_at cannot be after last_search_at");
  if (first > statusDayEnd || last > statusDayEnd) throw new Error("Executed search timestamps cannot be later than status_as_of");
  if (status.searches_complete_through) {
    const completeThrough = Date.parse(`${status.searches_complete_through}T00:00:00Z`);
    if (completeThrough > statusDayEnd) throw new Error("searches_complete_through cannot be a future claim");
  }
}

function validateEvidenceUrls(value: string, context: string): void {
  for (const source of value.split(/\s*;\s*/).filter(Boolean)) {
    const parsed = new URL(source);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`${context} contains an unsafe source URL`);
    }
  }
}

function validateNoPrivateMaterial(data: PublicData): void {
  const serialized = JSON.stringify(data);
  const forbidden = [/[A-Za-z]:\\/, /\/Users\//i, /\/home\//i, /\.private(?:[\\/]|\b)/i];
  if (forbidden.some((pattern) => pattern.test(serialized))) {
    throw new Error("Public catalogue data contains a private or local filesystem reference");
  }
}

function validatePublicData(data: PublicData): void {
  ensureUnique(data.resources.map((item) => item.resource_id), "resource_id");
  ensureUnique(data.assets.map((item) => item.asset_id), "asset_id");
  ensureUnique(data.candidates.map((item) => item.record_id), "record_id");
  ensureUnique(data.candidateAssets.map((item) => item.candidate_asset_id), "candidate_asset_id");
  ensureUnique(data.searchRuns.map((item) => item.run_id), "search run_id");

  const resourceIds = new Set(data.resources.map((item) => item.resource_id));
  const candidateIds = new Set(data.candidates.map((item) => item.record_id));
  for (const asset of data.assets) {
    if (!resourceIds.has(asset.resource_id)) throw new Error(`Asset ${asset.asset_id} refers to a missing resource`);
  }
  for (const asset of data.candidateAssets) {
    if (!candidateIds.has(asset.record_id)) throw new Error(`Candidate asset ${asset.candidate_asset_id} refers to a missing record`);
  }

  for (const candidate of data.candidates) {
    const assets = data.candidateAssets.filter((asset) => asset.record_id === candidate.record_id);
    if (assets.length !== candidate.asset_count) throw new Error(`Candidate ${candidate.record_id} has an incorrect asset_count`);
    validateEvidenceUrls(candidate.metadata_source_urls, candidate.record_id);
  }
  for (const resource of data.resources) validateEvidenceUrls(resource.metadata_source_urls, resource.resource_id);
  for (const asset of data.assets) validateEvidenceUrls(asset.source_evidence_urls, asset.asset_id);
  for (const asset of data.candidateAssets) validateEvidenceUrls(asset.source_evidence_urls, asset.candidate_asset_id);

  if (data.status.reviewed_resources !== data.resources.length) throw new Error("reviewed_resources does not match catalogue.csv");
  if (data.status.reviewed_assets !== data.assets.length) throw new Error("reviewed_assets does not match assets.csv");
  if (data.status.included_resources !== data.resources.filter((item) => item.current_status === "included").length) {
    throw new Error("included_resources does not match resources explicitly assigned to a manuscript version");
  }
  if (data.status.candidate_records_under_review !== data.candidates.length) throw new Error("candidate_records_under_review does not match candidates.csv");
  if (data.status.candidate_assets_under_review !== data.candidateAssets.length) throw new Error("candidate_assets_under_review does not match candidate_assets.csv");
  const statusDayEnd = Date.parse(`${data.status.status_as_of}T23:59:59.999Z`);
  for (const search of data.searchRuns) {
    if (Date.parse(`${search.searched_on}T00:00:00Z`) > statusDayEnd) {
      throw new Error(`Search run ${search.run_id} has a future search date`);
    }
  }
  validateDateState(data.status);
  validateNoPrivateMaterial(data);
}

async function loadPublicData(): Promise<PublicData> {
  const [resourceEntries, assetEntries, candidateEntries, candidateAssetEntries, updateEntries, searchRunEntries, statusText] = await Promise.all([
    getCollection("resources"),
    getCollection("assets"),
    getCollection("candidates"),
    getCollection("candidateAssets"),
    getCollection("updates"),
    getCollection("searchRuns"),
    readFile(resolve(process.cwd(), "catalogue", "review_status.json"), "utf8"),
  ]);

  const data: PublicData = {
    resources: resourceEntries.map((entry) => entry.data),
    assets: assetEntries.map((entry) => entry.data),
    candidates: candidateEntries.map((entry) => entry.data),
    candidateAssets: candidateAssetEntries.map((entry) => entry.data).sort((a, b) => a.position - b.position),
    updates: updateEntries.map((entry) => entry.data).sort((a, b) => b.published_on.localeCompare(a.published_on)),
    searchRuns: searchRunEntries.map((entry) => entry.data).sort((a, b) => b.searched_on.localeCompare(a.searched_on)),
    status: reviewStatusSchema.parse(JSON.parse(statusText)) as ReviewStatus,
  };
  validatePublicData(data);
  return data;
}

export function getPublicData(): Promise<PublicData> {
  publicDataPromise ??= loadPublicData();
  return publicDataPromise;
}

export function parseBoundingBox(value: string | null): [number, number, number, number] | null {
  if (!value) return null;
  const numbers = value.replace(/[\[\]]/g, "").split(/\s*[,|]\s*/).map(Number);
  if (numbers.length !== 4 || numbers.some((number) => !Number.isFinite(number))) {
    throw new Error(`Invalid WGS84 bounding box: ${value}`);
  }
  const [west, south, east, north] = numbers;
  if (west < -180 || east > 180 || south < -90 || north > 90 || west > east || south > north) {
    throw new Error(`Out-of-range WGS84 bounding box: ${value}`);
  }
  return [west, south, east, north];
}
