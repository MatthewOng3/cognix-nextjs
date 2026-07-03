import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * @description Check if the device is mobile
 * @returns true if the device is mobile, false otherwise
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  //
  React.useEffect(() => {
    //Javascript function to check if document matches given CSS media query.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    //Tells us if query matches and listen for changes, calls function when change happens
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
