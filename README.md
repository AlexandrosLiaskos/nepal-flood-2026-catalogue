# Public Data Resources for the 26 August 2026 Nepal Hazard Cascade

This repository holds the source code of the website of a living catalogue of publicly available resources
for the glacier-related hazard cascade of 26 August 2026 in Nepal: the mass movement, the debris flow and
the flood. The catalogue records pre-event baselines, event observations and later analyses, with their
provenance, access conditions, rights and limitations. It is the online catalogue of a living scoping
review. The site is built with [Astro](https://astro.build/).

The catalogue is by Alexandros Liaskos, Niki Evelpidou and Evangelos Spyrou (National and Kapodistrian
University of Athens) and Nitesh Khadka (Tribhuvan University).

- Site: <https://evelpidou.nkua.cloud/Nepal-Flood-2026-Catalogue/>
- Assessed release of 28 September 2026, archived on Zenodo: <https://doi.org/10.5281/zenodo.23034746>
  (all versions: <https://doi.org/10.5281/zenodo.23034745>)
- Interactive reconstruction of the event: <https://evelpidou.nkua.cloud/Nepal-Flood-2026/>, with its code
  at <https://github.com/AlexandrosLiaskos/nepal-flood-2026>

## Status

The repository holds the source of the site that is online, without the records of the catalogue. The
records stay with the site and with the Zenodo release (see [Not included](#not-included)). The history of
this repository starts with the state of 16 November 2026.

## Repository

| Place | Contents |
|---|---|
| `src/pages/` | The pages of the site, and in `src/pages/data/` the files that the site offers for download |
| `src/components/`, `src/layouts/`, `src/styles/` | The parts, the page layout and the style of the site |
| `src/lib/` | The code that reads, checks and formats the records |
| `src/content.config.ts` | The formats of the record files, which the build checks for every record |
| `catalogue/schemas/` | The JSON Schemas of the JSON files that the site publishes |
| `public/favicon.svg` | The icon of the site |
| `deployment/` | The files of the server: the container file, the web server configuration and the visit counter |
| `tests/` | The test records for a build without data and the tests of the visit counter |
| `astro.config.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json` | The settings of Astro, the packages and the build |
| `LICENSE`, `LICENSE.md`, `LICENSES/`, `THIRD_PARTY_NOTICES.md` | The licences and the notices of third-party material |
| `.github/workflows/` | The automatic checks |

## Not included

| Path in the source project | Contents | Reason |
|---|---|---|
| `catalogue/*.csv`, `catalogue/*.json` (16 files, 139 MB) | The records of the catalogue and the review status | They are the content of the catalogue, not code, and they are large. The site offers the records as download files, and the assessed release is archived on Zenodo. |
| `catalogue/README.md` | Notes on the record files and on earlier releases | It describes the records, which are not included, and links to the search reports |
| `public/search-reports/` (84 files) | The reports of the searches and their tables | Content of the catalogue, with data tables |
| `public/brand/`, `public/favicon-nkua.png` | The 190-year marks of the National and Kapodistrian University of Athens and the emblem of Tribhuvan University | Institutional marks, which are not offered under the licences of the project (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)) |
| `public/images/` | The two photographs of the home page | Third-party photographs (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)) |
| `public/social-preview.png` | The preview image that social media show for the site | It combines an institutional mark and a third-party photograph |
| Working files | Notes of the authors, design notes, instructions for coding assistants, build output and the earlier local history | They are not part of the site |

A build from this repository therefore has no records, no search reports, no marks and no photographs:
the pages refer to these files, and the browser does not find them.

## Building the site

The build needs [Node.js](https://nodejs.org/) 22.12 or later and [pnpm](https://pnpm.io/) 11.19.0.

```sh
git clone https://github.com/AlexandrosLiaskos/nepal-flood-2026-catalogue
cd nepal-flood-2026-catalogue
pnpm install --frozen-lockfile
cp tests/fixtures/catalogue/* catalogue/
pnpm build
```

The third command copies the test records, which hold no records (see
[tests/fixtures/README.md](tests/fixtures/README.md)). To build the full site, put the record files of the
catalogue in `catalogue/` instead: `catalogue.csv`, `assets.csv`, `candidates.csv`, `candidate_assets.csv`,
`updates.csv`, `search_runs.csv`, `review_status.json`, `assessment_resources.csv` and `.json`,
`assessment_assets.csv` and `.json`, `asset_reviews.csv` and `.json`, `asset_review_summary.json`,
`asset_metadata.csv` and `asset_follow_up.csv`.

The build checks every record against the formats in `src/content.config.ts` and `src/lib/data.ts`: the
identifiers are unique, every asset refers to an existing resource, the counts of `review_status.json`
match the records, no search is dated after the date of the review status and no record holds a local
file path. It stops at the first
error. The site is written to `dist/`, for the address path `/Nepal-Flood-2026-Catalogue/`. `pnpm dev`
serves it while it is edited, at <http://localhost:4321/Nepal-Flood-2026-Catalogue/>.

## Checks

The workflow `Checks` runs on every push and pull request. It installs the packages from the lockfile,
builds the site with the test records and checks that the main pages and data files are produced. It also
compiles and tests the visit counter with Python 3.12, validates `deployment/compose.yaml` with Docker
Compose and tests `deployment/nginx.conf` with `nginx -t` in the image `nginx:1.27-alpine`.

```sh
python -m unittest discover --start-directory tests --verbose
```

## Deployment

On the server, the folder `/opt/nepal-flood-2026-catalogue` holds the built site in `site/`, together with
`nginx.conf`, `compose.yaml`, `visit_counter.py` and the count of visits in `data/`; `deployment/` holds the
same server files. The container `nepal-flood-2026-catalogue` runs the image `nginx:1.27-alpine` with a
read-only file system, serves `site/` on port 8080 and passes `/api/visit` to the container
`nepal-flood-2026-catalogue-counter`, which runs `visit_counter.py` with the image `python:3.12-alpine` and
stores only the total number of visits. Both join the Docker network `nkua-proxy`, and the front web server
forwards <https://evelpidou.nkua.cloud/Nepal-Flood-2026-Catalogue/> to port 8080.

To publish a new build, keep a copy of `site/` and replace its contents with those of `dist/`. The web
server reads the files at each request, so no restart is needed.

The container mounts `nginx.conf` as a single file, so a new version must be written into the existing
file (for example `cat deployment/nginx.conf > /opt/nepal-flood-2026-catalogue/nginx.conf`) and loaded
with `docker exec nepal-flood-2026-catalogue nginx -s reload`.

## Citation and licence

To cite the catalogue, use its Zenodo DOI, as given in [CITATION.cff](CITATION.cff). As
[LICENSE.md](LICENSE.md) states, the original source code is licensed under the [MIT License](LICENSE),
and the original catalogue metadata, schemas and explanatory text under the
[Creative Commons Attribution 4.0 International licence](LICENSES/CC-BY-4.0.txt). Institutional marks and
third-party material are not covered by these licences; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
