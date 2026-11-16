# Test records

`catalogue/` holds the record files of the catalogue in their formats but without records: each CSV file has
only its header line, the JSON files hold empty lists, and `review_status.json` and
`asset_review_summary.json` hold zero counts with placeholder dates. They are not catalogue data.

The workflow `Checks` copies them into `catalogue/` before it builds the site, so that the build runs
without the records of the catalogue, which this repository does not hold. The site built with them has
no resources, assets or searches.

```sh
cp tests/fixtures/catalogue/* catalogue/
pnpm build
```
