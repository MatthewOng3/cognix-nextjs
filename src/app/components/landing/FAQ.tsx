import React from "react";
import { type LandingStyle } from "./landingStyle";

const faqs = [
  {
    question: "What stack does Cognix generate?",
    answer:
      "Cognix uses the NextJS framework, modern React with TypeScript and Tailwind CSS for the frontend, with a Supabase backend for your database and authentication. All generated apps are server-side rendered where possible for performance and SEO.",
  },
  {
    question: "Do I own the code Cognix generates?",
    answer:
      "Yes, completely. Every line of code Cognix generates belongs to you. You can request to export it to your own GitHub repository at any time with no lock-in.",
  },
  {
    question: "How is Cognix different from other AI coding tools like Bolt or Lovable?",
    answer:
      "Cognix focuses on production-readiness from the start, production ready code and scalability. Every app includes a structured PRD, a real Supabase database with Row Level Security, auth, SSR, and SEO configuration out of the box.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your data stays yours. Cognix provisions a Supabase project that you have full access to. We never store, sell, or monetize your database or application data.",
  },
];

interface FAQProps {
  styleVariant?: LandingStyle;
}

const FAQ: React.FC<FAQProps> = ({ styleVariant = "swiss" }) => {
  if (styleVariant === "beta") {
    return (
      <section id="faq" className="bg-background py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-border">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-6">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {faq.question}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (styleVariant === "space") {
    return (
      <section id="faq" className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-16 border-b border-white/10 pb-10 text-center">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              FAQ
            </div>
            <h2 className="mb-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[24px] border border-white/10 bg-slate-950/55 px-6 py-6 backdrop-blur-xl"
              >
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {faq.question}
                </h3>
                <p className="leading-8 text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-16 border-b border-border pb-10 text-center">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            FAQ
          </div>
          <h2 className="mb-4 text-3xl font-black uppercase tracking-[-0.05em] md:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="border border-border">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="bg-card px-6 py-6 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
            >
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {faq.question}
              </h3>
              <p className="leading-8 text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
