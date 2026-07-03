"use client";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { validateAndSanitizeEmail } from "@/app/lib/util/email-validation";

interface EmailFormProps {
  variant?: "hero" | "footer";
}

const EmailForm: React.FC<EmailFormProps> = ({ variant = "hero" }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate and sanitize email on client side
    const validation = validateAndSanitizeEmail(email);

    if (!validation.isValid) {
      setError(validation.error || "Please enter a valid email address");
      return;
    }

    // Use sanitized email
    const sanitizedEmail = validation.sanitized;
    setStatus("loading");

    try {
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: sanitizedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit email");
      }

      setStatus("success");
      setEmail(""); // Clear the email field
      setError(null);
    } catch (error) {
      console.error("Error submitting email:", error);
      setStatus("idle");
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  const heroWrapperClasses =
    variant === "hero" ? "relative isolate flex flex-col items-start" : "";
  const formGlowClasses =
    variant === "hero"
      ? "absolute -inset-0.5 bg-linear-to-r from-orange-500 via-amber-500 to-orange-400 rounded-full opacity-10 group-hover:opacity-30 transition duration-500 blur"
      : "";
  const formShellClasses =
    variant === "hero"
      ? "relative flex items-center bg-slate-950 rounded-full p-1 border border-slate-800 focus-within:border-slate-600 transition-colors shadow-[0_20px_60px_rgba(8,8,15,0.65)]"
      : "relative flex items-center bg-card rounded-full p-1 border border-border focus-within:border-amber-500/40 transition-colors";
  const inputClasses =
    variant === "hero"
      ? "flex-1 bg-transparent text-white px-4 py-3 outline-none placeholder:text-slate-500 rounded-l-full"
      : "flex-1 bg-transparent text-foreground px-4 py-3 outline-none placeholder:text-muted-foreground rounded-l-full";
  const buttonClasses =
    variant === "hero"
      ? "bg-white text-slate-950 hover:bg-slate-200 px-6 py-3 cursor-pointer rounded-full font-semibold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      : "bg-accent text-foreground hover:bg-accent/80 px-6 py-3 cursor-pointer rounded-full font-semibold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed";

  if (status === "success") {
    return (
      <div
        className={`flex items-center gap-2 text-green-400 font-medium ${variant === "hero" ? "justify-start" : "justify-center"}`}
      >
        <CheckCircle2 size={20} />
        <span>
          Thank you for your interest! I will get back to you shortly with the
          beta link
        </span>
      </div>
    );
  }

  return (
    <div className={heroWrapperClasses}>
      {variant === "hero" && (
        <>
          <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-linear-to-r from-orange-500 via-amber-500 to-orange-400 opacity-10 blur-3xl"></div>
          <div className="pointer-events-none absolute -inset-3 rounded-[32px] bg-linear-to-r from-orange-500/60 via-amber-400/40 to-orange-400/50 opacity-15 animate-pulse blur-2xl"></div>
        </>
      )}
      <form onSubmit={handleSubmit} className="w-full max-w-md relative group">
        {formGlowClasses ? <div className={formGlowClasses}></div> : null}
        <div className={formShellClasses}>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
            className={`${inputClasses} ${error ? "border-red-500" : ""}`}
            required
            maxLength={320}
            autoComplete="email"
            aria-label="Email address"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "email-error" : undefined}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className={buttonClasses}
          >
            {status === "loading" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Get Access</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
        {error && (
          <div
            id="email-error"
            className="mt-2 flex items-center gap-2 text-red-400 text-sm pl-4"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <p className="mt-3 text-sm text-foreground pl-4">
          Free $15 USD credits for early adopters. No credit card required.
        </p>
      </form>
    </div>
  );
};

export default EmailForm;
