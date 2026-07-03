import React from "react";

/**
 * @description Typewriter effect hook
 * @param text - The text to type
 * @param speed - The speed of the typewriter
 * @param enabled - Enable the typewriter effect.
 * @returns The typed text
 */
export function useTypewriter(text: string, speed = 40, enabled = true) {
  const [state, setState] = React.useState({ currentText: "", currentIdx: 0 });
  React.useEffect(() => {
    if (!enabled) {
      setState({ currentText: text, currentIdx: text.length });
      return;
    }
    setState({ currentText: "", currentIdx: 0 });
    const interval = setInterval(() => {
      setState(({ currentText, currentIdx }) => {
        if (currentIdx >= text.length) {
          clearInterval(interval);
          return { currentText, currentIdx };
        }

        return {
          currentText: currentText + text[currentIdx],
          currentIdx: currentIdx + 1,
        };
      });
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, enabled]);
  return state.currentText;
}
