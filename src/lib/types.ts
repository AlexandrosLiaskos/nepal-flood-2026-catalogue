import type { CollectionEntry } from "astro:content";

export type Resource = CollectionEntry<"resources">["data"];
export type Asset = CollectionEntry<"assets">["data"];
export type CandidateRecord = CollectionEntry<"candidates">["data"];
export type CandidateAsset = CollectionEntry<"candidateAssets">["data"];
export type PublicUpdate = CollectionEntry<"updates">["data"];
export type PublicSearchRun = CollectionEntry<"searchRuns">["data"];

export interface ReviewStatus {
  schema_version: "2.0.0";
  catalogue_status: "active";
  status_as_of: string;
  initial_cycle_started_on: string;
  first_search_at: string;
  last_search_at: string;
  searches_complete_through: string | null;
  manuscript_version: number | null;
  search_status: "initial_search_programme_in_progress" | "ongoing" | "reduced_frequency" | "retired";
  nomination_status: "under_review" | "open" | "closed";
  reviewed_resources: number;
  reviewed_assets: number;
  included_resources: number;
  candidate_records_under_review: number;
  candidate_assets_under_review: number;
  newly_eligible_awaiting_integration: number;
}

export interface PublicData {
  resources: Resource[];
  assets: Asset[];
  candidates: CandidateRecord[];
  candidateAssets: CandidateAsset[];
  updates: PublicUpdate[];
  searchRuns: PublicSearchRun[];
  status: ReviewStatus;
}
