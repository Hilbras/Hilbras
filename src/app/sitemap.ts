import type { MetadataRoute } from "next";
import { products } from "@/data/areas";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.domain;
  const routes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: site.lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const product of products) {
    routes.push({
      url: `${base}/products/${product.id}`,
      lastModified: site.lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return routes;
}
