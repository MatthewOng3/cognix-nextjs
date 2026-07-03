import { type LandingStyle, getLandingStyleHref } from "./landingStyle";

interface FooterProps {
  styleVariant?: LandingStyle;
}

export default function Footer({ styleVariant = "swiss" }: FooterProps) {
  const featuresHref = `${getLandingStyleHref(styleVariant)}#features`;

  if (styleVariant === "beta") {
    return (
      <footer className="border-t border-slate-700 bg-slate-750 pt-16 pb-8" id="Footer">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 grid gap-12 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <a href={getLandingStyleHref(styleVariant)} className="mb-4 flex items-center gap-2">
                <span className="text-lg font-bold text-white">Cognix</span>
              </a>
              <p className="max-w-sm text-slate-500">
                The AI-powered full-stack builder for startups. Go from idea to
                deployed MVP in minutes, not months.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Product</h4>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <a href={featuresHref} className="transition-colors hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/blog" className="transition-colors hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-8 md:flex-row">
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} Cognix AI Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  if (styleVariant === "space") {
    return (
      <footer className="border-t border-white/10 pt-16 pb-8" id="Footer">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 grid gap-12 border-b border-white/10 pb-12 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <a href={getLandingStyleHref(styleVariant)} className="mb-4 flex items-center gap-2">
                <span className="cognix-gradient-text text-lg font-bold uppercase tracking-[-0.03em]">
                  Cognix
                </span>
              </a>
              <p className="max-w-sm leading-8 text-slate-400">
                The AI-powered full-stack builder for startups. Go from idea to
                deployed MVP in minutes, not months.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                Product
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href={featuresHref} className="transition-colors hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/blog" className="transition-colors hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 pt-2 text-center md:flex-row md:text-left">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Cognix AI Inc. All rights reserved.
            </p>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Built for launch velocity
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border bg-background pt-16 pb-8" id="Footer">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-12 border-b border-border pb-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <a href={getLandingStyleHref(styleVariant)} className="mb-4 flex items-center gap-2">
              <span className="cognix-text text-lg font-bold uppercase tracking-[-0.03em]">
                Cognix
              </span>
            </a>
            <p className="max-w-sm leading-8 text-muted-foreground">
              The AI-powered full-stack builder for startups. Go from idea to
              deployed MVP in minutes, not months.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-foreground">
              Product
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href={featuresHref} className="transition-colors hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <a href="/blog" className="transition-colors hover:text-foreground">
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-2 text-center md:flex-row md:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cognix AI Inc. All rights reserved.
          </p>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Designed to ship, not just demo
          </div>
        </div>
      </div>
    </footer>
  );
}
