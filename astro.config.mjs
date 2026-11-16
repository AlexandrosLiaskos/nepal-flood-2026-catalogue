import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://evelpidou.nkua.cloud",
  base: "/Nepal-Flood-2026-Catalogue/",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/under-review/"),
    }),
  ],
});
