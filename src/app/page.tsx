/* eslint-disable */
import Navbar from "./components/landing/Navbar";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import HowItWorks from "./components/landing/HowItWorks";
import CTASection from "./components/landing/CTASection";
import Footer from "./components/landing/Footer";
import Pricing from "./components/landing/Pricing";
import Ownership from "./components/landing/Ownership";
import SupportPromise from "./components/landing/SupportPromise";
import { getBetaStatus } from "./lib/util/beta-gate";
import AppShowcase from "./components/landing/AppShowcase";
import FAQ from "./components/landing/FAQ";
import LandingStyleSwitcher from "./components/landing/LandingStyleSwitcher";
import { normalizeLandingStyle } from "./components/landing/landingStyle";

export const metadata = {
  title: "Cognix — AI-Powered Full-Stack App Builder. Ship your MVP in minutes",
  description: "Generate production-ready full-stack applications by chatting with AI. Build backends, frontends, databases, and SEO-friendly pages instantly by just vibe coding.",
  metadataBase: new URL("https://cognix.live"), // ✅ add this
  openGraph: {
    title: "Cognix — AI App Builder",
    description: "Turn ideas into full-stack apps with AI assistance.",
    url: "/",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    siteName: "Cognix",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognix — AI App Builder",
    description: "Generate full-stack applications quickly with AI.",
    image: "/og-image.png",
  },
};

const steps = [
  {
    id: "01",
    title: "Describe your Idea",
    text: "Chat with Cognix about what you want to build. The AI refines your requirements into a clear specification."
  },
  {
    id: "02",
    title: "Review the Plan",
    text: "Get a generated PRD, database schema, and feature roadmap. Approve it or ask for adjustments."
  },
  {
    id: "03",
    title: "Watch it Build",
    text: "Cognix agents write the frontend and backend code, connecting your UI to a real Supabase database."
  },
  {
    id: "04",
    title: "Deploy & Launch",
    text: "Receive a live link. Test your working MVP and invite your first users immediately."
  }
];

/**
 * @description Home page, plan to make this landing but for now just redirects since beta testing phase
 * @route /
 */
interface HomeProps {
  searchParams?: Promise<{
    style?: string | string[];
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const betaStatus = await getBetaStatus();
  const betaOpen = betaStatus.isOpen;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const landingStyle = normalizeLandingStyle(resolvedSearchParams?.style);
	
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-brand-primary selection:text-white">
      {landingStyle === "swiss" ? (
        <div className="pointer-events-none fixed inset-0 opacity-60">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--border)_55%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_55%,transparent)_1px,transparent_1px)] bg-[size:72px_72px]" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-linear-to-b from-transparent via-border to-transparent opacity-80" />
        </div>
      ) : landingStyle === "space" ? (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#172554_0%,#0b1120_38%,#050816_72%,#02030a_100%)]" />
          <div className="absolute left-[-10%] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute right-[-8%] top-[14rem] h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-[-8rem] left-[12%] h-[22rem] w-[30rem] rounded-full bg-orange-500/8 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.14)_0,transparent_1px)] bg-[length:22px_22px] opacity-20" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:96px_96px] opacity-25" />
          <div className="absolute inset-x-[10%] top-28 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
        </div>
      ) : null}
      <div className="relative z-10">
        <Navbar betaOpen={betaOpen} styleVariant={landingStyle} />
        <main>
          <Hero betaOpen={betaOpen} styleVariant={landingStyle} />
          {/* <AppShowcase/> */}
          <HowItWorks styleVariant={landingStyle} />
          <Features styleVariant={landingStyle} />
          <Ownership styleVariant={landingStyle} />
          <SupportPromise styleVariant={landingStyle} />
          <Pricing styleVariant={landingStyle} />
          <FAQ styleVariant={landingStyle} />
          <CTASection betaOpen={betaOpen} styleVariant={landingStyle} />
        </main>
        <Footer styleVariant={landingStyle} />
        {/* <LandingStyleSwitcher activeStyle={landingStyle} /> */}
      </div>
    </div>
  )
}
