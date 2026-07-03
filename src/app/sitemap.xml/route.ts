import { NextResponse } from "next/server";
import { getAllPosts } from "../lib/blog";

export async function GET() {
  const baseUrl = "https://cognix.live";
  const posts = getAllPosts();

  const urls = [
    {
      loc: "/",
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/blog",
      lastmod:
        posts[0]?.updatedAt ?? posts[0]?.date ?? new Date().toISOString(),
    },
    ...posts.map((post) => ({
      loc: `/blog/${post.slug}`,
      lastmod: post.updatedAt ?? post.date,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map(
        (url) => `
      <url>
        <loc>${url.loc.startsWith("http") ? url.loc : baseUrl + url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
      </url>
    `,
      )
      .join("")}
  </urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
