import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NavBar from "../../components/landing/Navbar";
import { getAllPosts, getPostBySlug } from "../../lib/blog";

const BASE_URL = "https://cognix.live";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const url = `${BASE_URL}/blog/${post.slug}`;

  return {
    title: `${post.title} | Cognix Blog`,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updatedAt ?? post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleUrl = `${BASE_URL}/blog/${post.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Cognix",
      url: BASE_URL,
    },
    mainEntityOfPage: articleUrl,
    url: articleUrl,
    keywords: post.tags.join(", "),
  };

  return (
    <div className="blog-surface min-h-screen bg-background text-foreground">
      <NavBar />
      <article className="mx-auto flex w-full max-w-4xl flex-col px-6 pb-24 pt-28">
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        <Link
          href="/blog"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--blog-secondary-text)] transition-colors hover:text-brand-primary"
        >
          <span aria-hidden="true">←</span>
          Back to blog
        </Link>

        <header className="rounded-[2rem] border border-border bg-card p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--blog-secondary-text)]">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>{post.readTime}</span>
            <span>By {post.author}</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--blog-secondary-text)]">
            {post.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="blog-prose mt-10 rounded-[2rem] border border-border bg-card p-8 md:p-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
