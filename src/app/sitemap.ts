import type { MetadataRoute } from "next";

const cities = [
  "seoul",
  "busan",
  "daegu",
  "incheon",
  "gwangju",
  "daejeon",
  "ulsan",
  "jeju",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  });

  // Generate entries for the last 30 days for each city
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    for (const city of cities) {
      entries.push({
        url: `${siteUrl}/${city}/${dateStr}`,
        lastModified: date,
        changeFrequency: i === 0 ? "daily" : "monthly",
        priority: i === 0 ? 0.9 : 0.6,
      });
    }
  }

  return entries;
}
