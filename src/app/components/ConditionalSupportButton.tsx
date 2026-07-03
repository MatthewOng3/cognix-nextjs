"use client";

import { usePathname } from "next/navigation";
import { SupportButton } from "./SupportButton";

/**
 * @description Wrapper component that conditionally renders SupportButton based on current route
 * @returns SupportButton or null
 */
export function ConditionalSupportButton() {
  const pathname = usePathname();

  // Define routes where support button should NOT appear
//   const excludedRoutes = [
//     "/project", // Project routes have support in sidebar
//   ];

//   // Check if current path starts with any excluded route
//   const shouldHideSupport = excludedRoutes.some(route => 
//     pathname.startsWith(route)
//   );

  // Don't render support button on excluded routes
//   if (shouldHideSupport) {
//     return null;
//   }

    // Check if current route is a nested project route
    const isNestedProjectRoute =
    pathname.startsWith("/project/") && pathname.split("/").length > 2;

    if (isNestedProjectRoute) {
        return null;
    }
    // Render support button on all other routes
    return <SupportButton />;
}