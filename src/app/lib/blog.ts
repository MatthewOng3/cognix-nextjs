import fs from "node:fs";
import path from "node:path";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  readTime: string;
  featured: boolean;
  content: string;
}

interface ParsedFrontmatter {
  metadata: Record<string, string | string[] | boolean>;
  content: string;
}

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const DEFAULT_AUTHOR = "Cognix Team";

function parseFrontmatter(raw: string): ParsedFrontmatter {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return {
      metadata: {},
      content: normalized.trim(),
    };
  }

  const [, block, body] = match;
  const metadata: Record<string, string | string[] | boolean> = {};

  for (const line of block.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!key) continue;

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const values = rawValue
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);

      metadata[key] = values;
      continue;
    }

    if (rawValue === "true" || rawValue === "false") {
      metadata[key] = rawValue === "true";
      continue;
    }

    metadata[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }

  return {
    metadata,
    content: body.trim(),
  };
}

function getMarkdownFiles(): string[] {
  if (!fs.existsSync(BLOG_CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(BLOG_CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);
}

function toPost(fileName: string): BlogPost {
  const filePath = path.join(BLOG_CONTENT_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const slug = fileName.replace(/\.md$/, "");
  const { metadata, content } = parseFrontmatter(raw);

  return {
    slug,
    title: typeof metadata.title === "string" ? metadata.title : slug,
    description:
      typeof metadata.description === "string" ? metadata.description : "",
    date: typeof metadata.date === "string" ? metadata.date : "",
    updatedAt:
      typeof metadata.updatedAt === "string" ? metadata.updatedAt : undefined,
    author:
      typeof metadata.author === "string" ? metadata.author : DEFAULT_AUTHOR,
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    readTime:
      typeof metadata.readTime === "string" ? metadata.readTime : "5 min read",
    featured: metadata.featured === true,
    content,
  };
}

export function getAllPosts(): BlogPost[] {
  return getMarkdownFiles()
    .map(toPost)
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}
