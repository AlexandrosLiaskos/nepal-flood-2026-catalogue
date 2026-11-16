export function humanize(value: string | null | undefined): string {
  if (!value) return "Not stated";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function fieldState(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    completed: "Completed",
    partial: "Partial",
    unavailable: "Unavailable",
    registration_required_as_documented: "Free registration required",
    restricted_authorization: "Authorization required; general access not established",
    authentication_required: "Authentication required",
    access_denied: "Anonymous access denied",
    invalid_source_uri: "Invalid provider download URI",
    known_invalid_archive: "Previously found to be an invalid archive",
    unexpected_html_response: "File request returned HTML",
    not_applicable_to_catalogued_role: "Not applicable to this asset role",
    restrictive_notice_present: "Restrictive reuse notice",
    stated_cc_by_4_0: "CC BY 4.0 stated by the source",
    package_license_stated: "Collection licence stated; asset rights need review",
    confirmed: "Confirmed",
    reviewed: "Reviewed",
    under_review: "Under review",
    not_stated: "Not stated",
    not_verified: "Not verified",
    conflicting: "Conflicting information",
    not_applicable: "Not applicable",
    reachable_without_authentication: "Reachable without registration",
    unavailable_at_check: "Unavailable at the recorded check",
    not_authorized: "Redistribution not authorized",
    "metadata_and_links_only; third_party_files_not_redistributed": "Metadata and links only; third-party files are not redistributed",
    not_redistributed: "Not redistributed by this catalogue",
  };
  return value ? labels[value] ?? humanize(value) : "Not stated";
}

export function rightsStatement(status: string | null | undefined, note: string | null | undefined): string {
  const detail = note?.trim();
  if (status === "confirmed") return detail || "Confirmed";
  return detail ? `${fieldState(status)} — ${detail}` : fieldState(status);
}

export function licenceStatement(
  spdx: string | null | undefined,
  url: string | null | undefined,
  status?: string | null,
  note?: string | null,
): string {
  const detail = note?.trim().replace(/[.]$/, "");
  if (status === "confirmed" && detail) return detail;
  if (spdx === "ODbL-1.0") return "Open Database License (ODbL 1.0)";
  if (spdx) return spdx;
  const normalizedUrl = url?.toLowerCase() ?? "";
  if (normalizedUrl.includes("cc-by-sa")) {
    return "Creative Commons Attribution Share-Alike (CC BY-SA; version not specified)";
  }
  if (normalizedUrl.includes("cc-by")) {
    return "Creative Commons Attribution (CC BY; version not specified)";
  }
  if (detail) return status && status !== "confirmed" ? `${fieldState(status)} — ${detail}` : detail;
  return status ? fieldState(status) : "Not stated";
}

export function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return "Not stated";
  if (start && end && start === end) return formatDate(start);
  if (!start) return `Until ${formatDate(end)}`;
  if (!end) return `From ${formatDate(start)}`;
  return `${formatDate(start)} to ${formatDate(end)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not stated";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function splitValues(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(/\s*[|;]\s*/).map((item) => item.trim()).filter(Boolean);
}

export function compactIdentifier(value: string): string {
  const parts = value.split(/[-_]/);
  return parts.length > 1 ? `${parts[0]}-${parts.at(-1)?.slice(0, 8)}` : value;
}

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, "")}`;
}

export function cleanScientificTitle(title: string): string {
  if (!title) return "Untitled Asset";
  let cleaned = title.trim();

  // Remove leading "Download "
  if (cleaned.startsWith("Download ")) {
    cleaned = cleaned.slice(9).trim();
  }

  // Remove repetitive trailing suffixes like " — map image"
  cleaned = cleaned.replace(/\s+[—–-]\s+map image(?:\s+[—–-]\s+item\s+\d+)?$/i, "");

  return cleaned;
}

export function extractBaseLayerName(title: string): { baseTitle: string; formatLabel: string | null } {
  if (!title) return { baseTitle: "Untitled", formatLabel: null };
  const trimmed = title.trim();
  const match = trimmed.match(/^(.*?)\s+[—–-]\s+(GeoJSON|Geopackage|KML|Shapefile|SHP|PDF|XLSX)$/i);
  if (match) {
    return {
      baseTitle: match[1].trim(),
      formatLabel: match[2].trim(),
    };
  }
  return { baseTitle: trimmed, formatLabel: null };
}

export function fileFormatLabel(format: string | null | undefined): string {
  if (!format) return "";
  const f = format.trim();
  const lower = f.toLowerCase();
  if (lower === "geopackage" || lower === "gpkg") return "GPKG";
  if (lower === "shapefile" || lower === "shp" || lower === "esri shapefile") return "SHP";
  if (lower === "geojson") return "GeoJSON";
  if (lower === "kml") return "KML";
  if (lower === "kmz") return "KMZ";
  if (lower === "geotiff" || lower === "tiff" || lower === "tif") return "GeoTIFF";
  if (lower === "netcdf" || lower === "nc") return "NetCDF";
  if (lower === "pdf") return "PDF";
  if (lower === "csv") return "CSV";
  if (lower === "zip") return "ZIP";
  if (lower === "png") return "PNG";
  if (lower === "jpeg" || lower === "jpg") return "JPEG";
  if (lower === "xml") return "XML";
  if (lower === "json") return "JSON";
  return f.length <= 6 ? f.toUpperCase() : humanize(f);
}
