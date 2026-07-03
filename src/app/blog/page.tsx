import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "../components/landing/Navbar";
import { getAllPosts } from "../lib/blog";

const BLOG_URL = "https://cognix.live/blog";

export const metadata: Metadata = {
  title:
    "Cognix Blog | AI Product Building Guides, Launch Notes, and Growth Tactics",
  description:
    "Read Cognix articles on AI product development, MVP launches, full-stack workflows, and practical strategies for shipping faster with less overhead.",
  alternates: {
    canonical: BLOG_URL,
  },
  openGraph: {
    title: "Cognix Blog",
    description:
      "Guides and launch notes for building full-stack products with AI.",
    url: BLOG_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognix Blog",
    description:
      "Guides and launch notes for building full-stack products with AI.",
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();
  const featuredPost = posts.find((post) => post.featured);
  const remainingPosts = posts.filter(
    (post) => post.slug !== featuredPost?.slug,
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Cognix Blog",
    description:
      "Guides and launch notes for building and launching AI-assisted products with Cognix.",
    url: BLOG_URL,
    publisher: {
      "@type": "Organization",
      name: "Cognix",
      url: "https://cognix.live",
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: {
        "@type": "Organization",
        name: post.author,
      },
      url: `${BLOG_URL}/${post.slug}`,
    })),
  };

  return (
    <div className="blog-surface min-h-screen bg-background text-foreground">
      <NavBar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-32">
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        <section className="blog-hero-grid overflow-hidden rounded-[2rem] border border-brand-border/60 bg-linear-to-br from-brand-surface via-background to-background p-8 shadow-[0_20px_80px_rgba(249,115,22,0.08)] md:p-12">
          <div className="max-w-3xl">
              <div className="mb-5 inline-flex rounded-full border border-brand-border bg-brand-surface px-4 py-1 text-sm font-medium text-brand-chip-foreground">
                Blog
              </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              Tactical writing for teams shipping AI products without slowing
              down.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--blog-secondary-text)]">
              Publish markdown, let Cognix render it, and keep every post ready
              for search, sharing, and server-rendered performance from day one.
            </p>
          </div>
        </section>

        {/* {featuredPost ? (
          <section>
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-border bg-card p-8 transition-transform duration-200 hover:-translate-y-1 hover:border-brand-border"
            >
              <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-[var(--blog-secondary-text)]">
                <span className="rounded-full bg-brand-surface px-3 py-1 font-medium text-brand-chip-foreground">
                  Featured
                </span>
                <time dateTime={featuredPost.date}>
                  {formatDate(featuredPost.date)}
                </time>
                <span>{featuredPost.readTime}</span>
              </div>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand-primary">
                {featuredPost.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--blog-secondary-text)]">
                {featuredPost.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {featuredPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--blog-secondary-text)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          </section>
        ) : null} */}

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--blog-secondary-text)]">
                All posts
              </p>
              {/* <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Launch notes, product guides, and SEO-friendly templates
              </h2> */}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {remainingPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-[1.5rem] border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-border"
              >
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--blog-secondary-text)]">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand-primary">
                  {post.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-[var(--blog-secondary-text)]">
                  {post.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
