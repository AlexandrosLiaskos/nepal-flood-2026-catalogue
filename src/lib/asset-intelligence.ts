/**
 * Scientific intelligence extraction and narrative synthesis for catalogue assets.
 * Translates raw database/crawler fields into rigorous, researcher-friendly domain intelligence.
 */

export interface TechnicalNotesParsed {
  memberCount: number | null;
  memberFormats: string[];
  featureCount: number | null;
  attributeCount: number | null;
  pageCount: number | null;
  version: string | null;
  additionalNotes: string;
}

export function parseAssetTechnicalNotes(notes: string | null | undefined): TechnicalNotesParsed {
  if (!notes) {
    return {
      memberCount: null,
      memberFormats: [],
      featureCount: null,
      attributeCount: null,
      pageCount: null,
      version: null,
      additionalNotes: "",
    };
  }

  // Sanitize known OEM-437 / GBK mojibake artifacts from legacy ZIP member extractions
  const cleanNotes = (notes || "")
    .replace(/\.?5m╩²╫╓╒²╔σ╙░╧±═╝/g, "0.5m digital orthophoto")
    .replace(/╩²╫╓╒²╔σ╙░╧±═╝/g, "digital orthophoto");

  let featureCount: number | null = null;
  let attributeCount: number | null = null;
  let memberCount: number | null = null;
  let memberFormats: string[] = [];

  const featMatch = cleanNotes.match(/Shapefile contains (\d+) features/i);
  if (featMatch) featureCount = parseInt(featMatch[1], 10);

  const attrMatch = cleanNotes.match(/(\d+) attribute fields/i);
  if (attrMatch) attributeCount = parseInt(attrMatch[1], 10);

  const memMatch = cleanNotes.match(/Archive (?:contains|directory lists) (\d+) members/i);
  if (memMatch) memberCount = parseInt(memMatch[1], 10);

  const fmtMatch = cleanNotes.match(/formats ([^;]+)(?:;|$)/i);
  if (fmtMatch) {
    memberFormats = fmtMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^\[|\]$/g, ""))
      .filter(Boolean);
  }

  let pageCount: number | null = null;
  let version: string | null = null;
  const pageMatch = cleanNotes.match(/(\d+)\s+pages?/i);
  if (pageMatch) pageCount = parseInt(pageMatch[1], 10);
  const verMatch = cleanNotes.match(/version\s+(\d+)/i);
  if (verMatch) version = verMatch[1];

  let additionalNotes = cleanNotes
    .replace(/Archive (?:contains|directory lists) \d+ members;?\s*/i, "")
    .replace(/formats [^;]+;?\s*/i, "")
    .replace(/Shapefile contains \d+ features;?\s*/i, "")
    .replace(/\d+ attribute fields;?\s*/i, "")
    .replace(/\d+\s+pages?;?\s*/i, "")
    .replace(/current (?:EarthArXiv )?version \d+;?\s*/i, "")
    .trim();

  // If only punctuation remains, clear it
  if (/^[;.,\s]+$/.test(additionalNotes)) {
    additionalNotes = "";
  }

  return {
    memberCount,
    memberFormats,
    featureCount,
    attributeCount,
    pageCount,
    version,
    additionalNotes,
  };
}

export function getAssetScientificRole(domainId: string): string {
  switch (domainId) {
    case "seismicity":
      return "Pre-event seismotectonic baseline inventory for assessing active fault structures, historical earthquake distribution, and potential seismic triggers of mass wasting.";
    case "terrain":
      return "High-resolution terrain model supporting digital elevation extraction, slope gradient calculation, and debris flow / flood inundation routing.";
    case "cryosphere_source":
      return "Glaciological and cryospheric monitoring dataset capturing snow cover, ice dynamics, glacial lakes, or high-altitude source zones.";
    case "radar_sar":
      return "Synthetic Aperture Radar (SAR) remote sensing product providing day/night, cloud-penetrating observations of surface displacement, backscatter changes, and flood inundation.";
    case "optical_eo":
      return "Multispectral optical satellite imagery capturing high-resolution surface reflectance for pre- and post-disaster geomorphic and environmental comparison.";
    case "infrastructure_impacts":
      return "Critical geospatial exposure and impact layer (settlements, road networks, bridges, buildings) for physical damage evaluation and vulnerability assessment.";
    case "hydrology_flood":
      return "Hydrometric observations, gauge discharge measurements, or satellite-derived flood extent mapping along the river system.";
    case "preprints":
      return "Scientific research manuscript providing observational reconstructions, numerical flood routing, hydrodynamic modeling, or cascade failure analysis.";
    case "reports_synthesis":
      return "Official disaster situation report or humanitarian bulletin summarizing field observations, casualty statistics, and emergency operations.";
    case "reference_vector":
      return "Geographic boundary and baseline reference geometry supporting spatial registration and regional context.";
    default:
      return "Geospatial research dataset supporting scientific investigation and baseline modeling of the 2026 Nepal hazard cascade.";
  }
}

export function getCleanTemporalRole(
  temporalRole?: string,
  reviewTemporalAssessment?: string,
  start?: string,
  end?: string,
): { label: string; detail: string } {
  const r = (temporalRole || "").toLowerCase();
  const rev = (reviewTemporalAssessment || "").toLowerCase();

  const startYear = start ? start.slice(0, 4) : "";
  const endYear = end ? end.slice(0, 4) : "";
  const span = startYear && endYear ? `${startYear}–${endYear}` : startYear || endYear || "";

  if (r === "not_stated_in_title" || !r) {
    if (rev === "pre_event" || rev === "baseline_reference" || rev === "historical_context") {
      return {
        label: "Pre-event Historical Baseline",
        detail: span ? `Historical record spanning ${span}` : "Pre-event reference period",
      };
    }
    if (rev === "event_or_post_event" || rev === "spans_event") {
      return {
        label: "Event & Post-Event",
        detail: "August 2026 cascade observation",
      };
    }
    return {
      label: "Date not established",
      detail: span ? `Period: ${span}` : "Temporal role not established",
    };
  }

  if (r.includes("baseline")) {
    return {
      label: "Historical Baseline",
      detail: span ? `Baseline record spanning ${span}` : "Pre-event reference",
    };
  }

  if (r.includes("rapid_event") || r.includes("damage_assessment") || r.includes("post_event")) {
    return {
      label: "Event / Post-Event Assessment",
      detail: span ? `Observation dates: ${span}` : "Disaster response period",
    };
  }

  if (r.includes("humanitarian_response")) {
    return {
      label: "Humanitarian & Emergency Response",
      detail: "Disaster relief and situation monitoring",
    };
  }

  if (r.includes("event_analysis")) {
    return {
      label: "Disaster Event Analysis",
      detail: "Physical cascade reconstruction",
    };
  }

  const humanized = r
    .replaceAll("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    label: humanized,
    detail: span ? `Period: ${span}` : "",
  };
}

export function getCleanContributorDisplay(
  normalized?: string,
  listed?: string,
  host?: string,
): { primary: string; secondary?: string } {
  const norm = (normalized || "").trim();
  const list = (listed || "").trim();
  const h = (host || "").trim();

  // If normalized exists and differs from listed
  if (norm && list && norm.toLowerCase() !== list.toLowerCase()) {
    // Check if listed is non-Latin (e.g. Chinese)
    const isNonLatin = /[^\u0000-\u007F]/.test(list);
    if (isNonLatin) {
      return {
        primary: norm,
        secondary: `Original provider: ${list}`,
      };
    }
    return {
      primary: norm,
      secondary: `Listed as: ${list}`,
    };
  }

  if (norm) {
    return { primary: norm };
  }

  if (list) {
    return { primary: list };
  }

  if (h) {
    return { primary: h };
  }

  return { primary: "Not stated" };
}

export function getCleanMethodStatus(status?: string): string {
  if (!status) return "Not stated";
  const s = status.toLowerCase();
  if (s.includes("not_stated_at_asset_level")) {
    return "Not stated at asset level";
  }
  if (s.includes("documented_at_parent_record_level")) {
    return "Documented at parent repository record level";
  }
  if (s.includes("documented_in_manuscript")) {
    return "Documented in the manuscript methodology";
  }
  if (s.includes("documented_in_report")) {
    return "Documented in the source report";
  }
  return status.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getCleanRelationshipToResource(relationship?: string, parentTitle?: string): string {
  if (!relationship) return `Component asset of ${parentTitle || "parent resource"}.`;
  const r = relationship.toLowerCase();
  if (r.includes("listed child asset")) {
    return "Component geospatial vector layer distributed as part of this emergency service.";
  }
  if (r.includes("event-specific pre-event or post-event imagery package")) {
    return "Event-specific satellite acquisition package distributed via this emergency service.";
  }
  if (r.includes("asset listed by the hdx")) {
    return "Geospatial layer catalogued in the Humanitarian Data Exchange (HDX) response inventory.";
  }
  if (r.includes("full-text pdf")) {
    return "Complete full-text scientific PDF document.";
  }
  if (r.includes("situation-update") || r.includes("situation-report")) {
    return "Official situation report in the response series.";
  }
  return relationship.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) + ".";
}

export function parseBoundingBox(bboxStr?: string): { west: string; south: string; east: string; north: string } | null {
  if (!bboxStr) return null;
  try {
    const cleaned = bboxStr.replace(/^["']|["']$/g, "").trim();
    const nums = JSON.parse(cleaned);
    if (Array.isArray(nums) && nums.length === 4) {
      const [w, s, e, n] = nums.map((v) => Number(v));
      if (!isNaN(w) && !isNaN(s) && !isNaN(e) && !isNaN(n)) {
        return {
          west: `${Math.abs(w).toFixed(2)}° ${w >= 0 ? "E" : "W"}`,
          south: `${Math.abs(s).toFixed(2)}° ${s >= 0 ? "N" : "S"}`,
          east: `${Math.abs(e).toFixed(2)}° ${e >= 0 ? "E" : "W"}`,
          north: `${Math.abs(n).toFixed(2)}° ${n >= 0 ? "N" : "S"}`,
        };
      }
    }
  } catch {
    // fallback regex
    const match = bboxStr.match(/\[?\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]?/);
    if (match) {
      const [, w, s, e, n] = match.map(Number);
      return {
        west: `${Math.abs(w).toFixed(2)}° ${w >= 0 ? "E" : "W"}`,
        south: `${Math.abs(s).toFixed(2)}° ${s >= 0 ? "N" : "S"}`,
        east: `${Math.abs(e).toFixed(2)}° ${e >= 0 ? "E" : "W"}`,
        north: `${Math.abs(n).toFixed(2)}° ${n >= 0 ? "N" : "S"}`,
      };
    }
  }
  return null;
}
