import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface AssessmentResource {
  resource_id: string;
  reviewed_title: string;
  original_title: string;
  landing_url: string;
  review_state: string;
  eligibility_outcome: string;
  specific_decision: string;
  reason: string;
  assessment_date: string;
  source_evidence: string[];
  metadata_corrections: string;
  [key: string]: unknown;
}

export interface AssessmentAsset {
  asset_id: string;
  resource_id: string;
  reviewed_title: string;
  original_title: string;
  asset_url: string;
  review_state: string;
  eligibility_outcome: string;
  specific_decision: string;
  information_role: string;
  scientific_validation: string;
  reason: string;
  assessment_date: string;
  source_evidence: string[];
  metadata_corrections: string;
  [key: string]: unknown;
}

function evidenceUrls(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\s*;\s*/) : [];
  return [...new Set(entries.filter((item): item is string => typeof item === "string").filter((item) => {
    try { return ["http:", "https:"].includes(new URL(item).protocol); } catch { return false; }
  }))];
}

async function readLedger<T extends AssessmentResource | AssessmentAsset>(filename: string, idKey: "resource_id" | "asset_id"): Promise<T[]> {
  const parsed = JSON.parse(await readFile(resolve(process.cwd(), "catalogue", filename), "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${filename} must contain an assessment array`);
  const seen = new Set<string>();
  return parsed.map((row) => {
    if (!row || typeof row[idKey] !== "string" || !row[idKey]) throw new Error(`${filename} has a missing ${idKey}`);
    if (seen.has(row[idKey])) throw new Error(`${filename} has a duplicate ${idKey}: ${row[idKey]}`);
    seen.add(row[idKey]);
    return { ...row, source_evidence: evidenceUrls(row.source_evidence) } as T;
  });
}

let resourcePromise: Promise<AssessmentResource[]> | undefined;
let assetPromise: Promise<AssessmentAsset[]> | undefined;

export function getResourceAssessments(): Promise<AssessmentResource[]> {
  resourcePromise ??= readLedger<AssessmentResource>("assessment_resources.json", "resource_id");
  return resourcePromise;
}

export function getAssetAssessments(): Promise<AssessmentAsset[]> {
  assetPromise ??= readLedger<AssessmentAsset>("assessment_assets.json", "asset_id");
  return assetPromise;
}

export async function getAssessmentLedger(): Promise<{ resources: AssessmentResource[]; assets: AssessmentAsset[] }> {
  const [resources, assets] = await Promise.all([getResourceAssessments(), getAssetAssessments()]);
  return { resources, assets };
}

export function assessmentCorrections(value: unknown): { field: string; value: string }[] {
  if (!value) return [];
  let parsed = value;
  if (typeof value === "string") {
    if (!value.trim() || ["{}", "[]", "null"].includes(value.trim())) return [];
    try { parsed = JSON.parse(value); } catch { return [{ field: "Correction", value }]; }
  }
  if (!parsed || typeof parsed !== "object") return [{ field: "Correction", value: String(parsed) }];
  return Object.entries(parsed).map(([field, detail]) => ({
    field,
    value: typeof detail === "string" ? detail : JSON.stringify(detail),
  }));
}
