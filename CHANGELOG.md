# Public catalogue change history

## 17 November 2026 — Visits of people

- The visit count was corrected from 12,095 to 1,245, the number of visits by people. It was measured in the front web server's log (entries from 4 September 2026): every counting request (POST to `/Nepal-Flood-2026-Catalogue/api/visit`, status 200) was left out as automated if its user agent named a robot, an automation tool or an HTTP library, if it came from the server itself, or if its address belonged to a cloud or hosting network. 1,243 requests were by people; the 10 visits counted on 3-4 September 2026, before the log begins, are estimated at 2. Of the 13,206 counted requests, 9,982 came from cloud or hosting networks (9,387 from Tencent Cloud) and 1,970 named a robot (Meta 1,656, Google 179, OpenAI 81).
- `deployment/nginx.conf` answers counting requests from robots and from cloud or hosting networks with 204 and does not pass them to the counter (see `deployment/visit-filter/README.md`). It trusts `X-Forwarded-For` from the front server only.
- `deployment/visit-filter/` holds the list of networks with its sources and date, and the program that fetches it and writes it into `nginx.conf`. The workflow checks that `nginx.conf` matches the list.

## 17 November 2026 — Visit counter address and stop signal

- `deployment/nginx.conf` passes `/api/visit` to the counter by its container name,
  `nepal-flood-2026-catalogue-counter`, which nginx looks up through the Docker resolver every 30 seconds.
  The service name `counter` used before is shared by other visit counters on the network `nkua-proxy`.
- `deployment/compose.yaml` stops the counter with SIGINT. The counter runs as PID 1 without a SIGTERM
  handler, so it ignored the default stop signal and was killed after 10 seconds.
- The workflow tests `deployment/nginx.conf` without mapping the name `counter`.

## 16 November 2026 — Source code on GitHub

- Published the source code of the site in this repository, without the records of the catalogue, the search reports, institutional marks and third-party photographs.
- Added header-only test records, so that the site can be built without the records, and the automatic checks.
- Added the README, the code of conduct and the MIT License text at the root of the repository.

## 5 September 2026 — Disaster-imagery searches

- Recorded ten completed source/interface runs and one partial OpenAerialMap outcome, with frozen strategies, retrieval evidence and dispositions.
- Added 21 candidate resources and 2,636 candidate asset links under review; preserved the separate 27 reviewed resources and 270 reviewed assets.
- Linked Charter activation 1052 and call 1209, and retained 20 OAM rediscovery routes under the original Planet/Vantor candidate identities.
- Staged seven NCDC package additions and ten EMS imagery-layer additions against existing resources. Preserved the EMSR927 AOI05 version-3 correction notice beside historical version-1 references.
- Documented the partial search, rights/time conflicts, metadata-only access and next-phase leads in the [search report](public/search-reports/2026-09-05-disaster-imagery.md).
- Kept the broader initial programme open. This update did not build or deploy the site.

## 3 September 2026 — Catalogue opened

- Opened the public catalogue and downloadable data contracts.
- Recorded that searches commenced on 3 September 2026 and remain in progress.
- Published one NCDC candidate record and its 72 listed assets as under review.
- Included-resource count remains zero.
