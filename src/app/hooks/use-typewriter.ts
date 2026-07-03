"use client";

import { useEffect, useState } from "react";

/**
 * @description Hook that simulates a typewriter effect for an array of texts
 * @param texts Array of strings to type out
 * @param speed Typing speed in ms
 * @param pause Pause duration in ms before deleting
 * @returns Current typed text and the index of the current text being typed
 */
export function useTypewriter(
  texts: string[],
  speed: number = 50,
  pause: number = 2000
) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const i = currentIndex % texts.length;
    const fullText = texts[i];

    // If typing is finished, pause then start deleting
    if (!isDeleting && displayText === fullText) {
      const timeout = setTimeout(() => setIsDeleting(true), pause);
      return () => clearTimeout(timeout);
    }

    // If deleting is finished, switch to next text and start typing
    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText((current) => {
        if (isDeleting) {
          return fullText.substring(0, current.length - 1);
        } else {
          return fullText.substring(0, current.length + 1);
        }
      });
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, texts, speed, pause]);

  return { displayText, currentIndex };
}
