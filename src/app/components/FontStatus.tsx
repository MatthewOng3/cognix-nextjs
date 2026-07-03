"use client";

import { useEffect, useState } from "react";

export function FontStatus() {
  const [fontsError, setFontsError] = useState(false);

  useEffect(() => {
    // Check if fonts are loaded after a delay
    const checkFonts = () => {
      // Simple check for font loading
      const testElement = document.createElement("span");
      testElement.style.fontFamily =
        "var(--font-geist-sans), system-ui, Arial, sans-serif";
      testElement.style.fontSize = "16px";
      testElement.style.visibility = "hidden";
      testElement.style.position = "absolute";
      testElement.textContent = "Test";

      document.body.appendChild(testElement);

      // If the font is not loaded, the width will be different
      const width = testElement.offsetWidth;
      document.body.removeChild(testElement);

      // If width is very small, font might not be loaded
      if (width < 10) {
        setFontsError(true);
      }
    };

    // Wait for fonts to load
    const timer = setTimeout(checkFonts, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsError) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "#fef3c7",
        color: "#92400e",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        zIndex: 9999,
        border: "1px solid #f59e0b",
        maxWidth: "200px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      Using fallback fonts (Google Fonts unavailable)
    </div>
  );
}
