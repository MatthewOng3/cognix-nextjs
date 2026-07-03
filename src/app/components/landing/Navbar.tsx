"use client";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/app/lib/utils";
import { type LandingStyle, getLandingStyleHref } from "./landingStyle";

interface NavBarProps {
  betaOpen?: boolean;
  styleVariant?: LandingStyle;
}

export default function NavBar({
  betaOpen = false,
  styleVariant = "swiss",
}: NavBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;

    const initialTheme = storedTheme ?? "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const navLinks = [
    { name: "Features", href: `${getLandingStyleHref(styleVariant)}#features` },
    {
      name: "How it Works",
      href: `${getLandingStyleHref(styleVariant)}#how-it-works`,
    },
    { name: "Pricing", href: `${getLandingStyleHref(styleVariant)}#pricing` },
    { name: "Blog", href: "/blog" },
  ];

  const isSwiss = styleVariant === "swiss";
  const isSpace = styleVariant === "space";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? isSwiss
            ? "border-b border-border bg-background/92 py-4 backdrop-blur-md"
            : isSpace
              ? "border-b border-white/10 bg-slate-950/70 py-4 backdrop-blur-xl"
            : "border-b border-border bg-background/80 py-4 backdrop-blur-md"
          : "bg-transparent py-6",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6">
        <a href={getLandingStyleHref(styleVariant)} className="flex items-center gap-2">
          <span
            className={cn(
              "cognix-text text-xl",
              isSwiss
                ? "font-black uppercase tracking-[-0.04em]"
                : isSpace
                  ? "font-black uppercase tracking-[-0.04em] text-white"
                : "font-bold",
            )}
          >
            Cognix Studio
          </span>
        </a>

        <div
          className={cn(
            "hidden md:flex md:items-center md:gap-6 md:text-muted-foreground",
            isSwiss
              ? "border border-border bg-background/80 px-5 py-3"
              : isSpace
                ? "rounded-full border border-white/10 bg-slate-950/55 px-5 py-3 backdrop-blur-xl"
              : "",
          )}
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "text-muted-foreground transition-colors hover:text-foreground",
                isSwiss
                  ? "text-sm font-medium uppercase tracking-[0.18em]"
                  : isSpace
                    ? "text-sm font-medium uppercase tracking-[0.18em] text-slate-300"
                  : "text-sm font-medium",
              )}
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "flex cursor-pointer items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-accent",
              isSwiss ? "h-10 w-10 bg-card" : "h-9 w-9 rounded-full bg-card",
              isSpace && "h-10 w-10 border-white/10 bg-slate-950/60 text-slate-300 hover:bg-slate-900",
            )}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className={cn(
              "text-muted-foreground hover:text-foreground md:hidden",
              isSwiss ? "border border-border bg-card p-2.5" : "",
              isSpace && "rounded-full border border-white/10 bg-slate-950/60 p-2.5 text-slate-300 hover:bg-slate-900",
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 border-b border-border bg-background p-6 shadow-2xl md:hidden",
            !isSwiss && "flex flex-col gap-4",
          )}
        >
          <div className={cn(isSwiss && "flex flex-col gap-4 border border-border bg-card p-5")}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  "font-medium text-muted-foreground hover:text-foreground",
                  isSwiss && "uppercase tracking-[0.18em]",
                  isSpace && "uppercase tracking-[0.18em] text-slate-300",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a
              href={betaOpen ? "/auth/register" : `${getLandingStyleHref(styleVariant)}#CTA`}
              className={cn(
                "text-center font-bold",
                isSwiss
                  ? "bg-foreground px-5 py-3 uppercase tracking-[0.16em] text-background"
                  : isSpace
                    ? "rounded-full border border-cyan-300/40 bg-linear-to-r from-cyan-400 to-blue-500 px-5 py-3 uppercase tracking-[0.16em] text-slate-950"
                  : "cognix-gradient rounded-lg px-5 py-3 text-foreground",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {betaOpen ? "Join Beta" : "Get Early Access"}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
