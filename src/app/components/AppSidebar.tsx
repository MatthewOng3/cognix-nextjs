"use client";

import { MessageSquare, Cable, ChevronFirst, ChevronLast, MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { LoadingOverlay } from "./loading-overlay";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

// ============================================================================
// CONSTANTS for App sidebar options, unlikely to change
// ============================================================================
const navigationItems = [
  {
    title: "AI Builder",
    path: "build",
    icon: MessageSquare,
    description: "Build your application with AI",
  },
  {
    title: "Integrations",
    path: "integration",
    icon: Cable,
    description: "Manage project integrations"
  },
];

interface AppSidebarProps {
  onSupportClick?: () => void;
}

/**
 * @description Retractable Sidebar for project tools, AI builder, Database manager etc
 * @implementations project/layout.tsx
 */
export function AppSidebar({ onSupportClick }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const projectId = pathname.split("/")[2];
  const [isOpen, setIsOpen] = React.useState(true);

  const [isLoading, setIsLoading] = React.useState(false);

  // Listen to page navigation complete
  React.useEffect(() => {
    setIsLoading(false); // Reset loading after route change
  }, [pathname]);

  const handleNavigation = (path: string) => {
    if (pathname === path) return; // Do nothing if already on the page
    setIsLoading(true);
    router.push(path);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`border-r border-border bg-background backdrop-blur-sm transition-all duration-300 ease-in-out flex-shrink-0 relative flex flex-col ${isOpen ? 'w-64' : 'w-16'
        }`}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={`absolute top-2 z-50 h-8 w-8 hover:bg-muted border border-border bg-background shadow-md cursor-pointer ${isOpen ? 'right-2' : 'left-1/2 -translate-x-1/2'
          }`}
      >
        {isOpen ?
          <ChevronFirst className="h-4 w-4" />
          : <ChevronLast className="h-4 w-4" />
        }
      </Button>

      {/* Navigation Items - Scrollable */}
      <div className={`p-2 ${isOpen ? 'pt-12' : 'pt-12'} flex-1  `}>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname.includes(
              `/project/${projectId}/${item.path}`,
            );

            // When collapsed, show icon-only buttons with tooltips
            if (!isOpen) {
              return (
                <div key={item.title}>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            handleNavigation(`/project/${projectId}/${item.path}`)
                          }
                          disabled={isLoading && isActive}
                          className={`w-12 h-12 rounded-lg transition-colors group flex items-center justify-center mx-auto cursor-pointer ${isActive ? "bg-muted" : "hover:bg-muted"
                            }`}
                        >
                          {isLoading && isActive ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
                          ) : (
                            <item.icon
                              className={`w-5 h-5 ${isActive
                                  ? "text-accent"
                                  : "text-muted-foreground group-hover:text-accent"
                                } transition-colors`}
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex flex-col gap-1">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            }

            // When open, show full buttons
            return (
              <button
                key={item.title}
                onClick={() =>
                  handleNavigation(`/project/${projectId}/${item.path}`)
                }
                disabled={isLoading && isActive}
                className={`w-full h-auto p-3 rounded-lg transition-colors group ${isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/90"
                  }`}
              >
                <div className="flex flex-col items-start gap-1 text-left">
                  <div className="flex items-center gap-3 w-full">
                    {isLoading && isActive ? (
                      <LoadingOverlay text="Loading..." />
                    ) : (
                      <item.icon
                        className={`w-5 h-5 ${isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-orange-400"
                          } transition-colors`}
                      />
                    )}
                    <span
                      className={`font-medium text-sm ${isActive ? "text-foreground" : "text-foreground"}`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-shadow-white leading-tight">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Support Button at Bottom */}
      <div className="p-2 border-t border-border">
        {isOpen ? (
			<Button
				onClick={onSupportClick}
				className="
				w-full
				bg-accent
				!text-black
				font-medium
			    hover:bg-accent/80
				transition-all
				shadow-lg
				cursor-pointer
				"
				size="sm"
			>
				<MessageCircle className="w-4 h-4 mr-2" />
				Contact Support
			</Button>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onSupportClick}
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 mx-auto rounded-lg hover:bg-orange-500/10 cursor-pointer transition-all"
                >
                  <MessageCircle className="w-5 h-5 text-muted-foreground hover:text-orange-400 transition-colors" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="font-medium">Contact Support</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}