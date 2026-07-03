"use client";

import { Bell, Rocket, SquareArrowOutUpRight, ChevronsUpDown, Check, Plus, Pencil, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { useAuth } from "../hooks/use-auth";
import { useProject } from "../hooks/use-project";
import { useUser } from "../hooks/use-user";
import { createSupabaseClient } from "../lib/util/supabase/client";
import { useAlert } from "./AlertNotif";
import { UserDropdown } from "./UserDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/lib/utils";
import { useState } from "react";
import { RenameProjectDialog } from "./RenameProjectDialog";
import { useEffect } from "react";

/**
 * @description Discord icon SVG component
 */
function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

/**
 * @description Sticky header component use in project workspaces.
 * @returns
 */
export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const { activeProject, projectList } = useProject();
  const { userData } = useUser();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const { showAlert } = useAlert();

  // Initialize theme on mount
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

  // Persist theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogoClick = () => {
    router.push("/project");
  };

  const handleProjectSelect = (projectId: string) => {
    router.push(`/project/${projectId}/build`);
  };

  const handleNewProject = () => {
    router.push("/project");
  };

  /**
   * @description Logout functionality
   */
  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error Signing Out", error);
    } else {
      // Redirect to login page after successful logout
      router.replace("/auth/login");
    }
  }
  // console.log("Header render - credits:", userData?.credit_balance);
  return (
    <>
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-3 cursor-pointer hover:cursor-pointer bg-transparent"
              onClick={handleLogoClick}
            >
              {/* Logo Image */}
              {/* <div className="relative h-8 w-8 flex-shrink-0">
                <Image
                  src="/cognix-logo-v3.png"
                  alt="Cognix Studio Logo"
                  className="object-contain"
                  priority
                  height={40}
                  width={40}
                />
              </div> */}
              <h1 className="text-2xl font-bold cognix-text hidden sm:block">
                Cognix
              </h1>
            </div>

            <div className="h-6 w-px bg-border mx-1"></div>

            {/* Project Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-accent/50 focus:ring-0 focus:ring-offset-0"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-foreground">
                      {activeProject?.projectName || "Select Project"}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {activeProject?.status || "Loading..."}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px]">
                {activeProject && (
                  <>
                    <DropdownMenuItem
                      onSelect={() => setIsRenameDialogOpen(true)}
                      className="cursor-pointer font-medium"
                    >
                      <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Rename Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Projects</DropdownMenuLabel>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {projectList.map((project) => (
                    <DropdownMenuItem
                      key={project.projectId}
                      onSelect={() => handleProjectSelect(project.projectId)}
                      className="flex items-center justify-between cursor-pointer py-2"
                    >
                      <div className="flex flex-col truncate">
                        <span className="font-medium truncate">{project.projectName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {activeProject?.projectId === project.projectId && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleNewProject} className="cursor-pointer text-primary focus:text-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
			
			<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-purple-400 font-bold text-sm">
                {`${Math.floor(userData.credit_balance * 10) / 10}`}
              </span>
              <span className="text-xs text-muted-foreground">
                AI Credits
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Discord Link */}
            <a
              href="https://discord.gg/EWzVwKUq8b"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card hover:bg-accent transition-colors text-muted-foreground hover:text-[#5865F2]"
              aria-label="Join our Discord"
            >
              <DiscordIcon size={18} />
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center cursor-pointer w-9 h-9 rounded-full border border-border bg-card hover:bg-accent transition-colors text-muted-foreground"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <UserDropdown user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      {activeProject && (
        <RenameProjectDialog
          isOpen={isRenameDialogOpen}
          onOpenChange={setIsRenameDialogOpen}
          projectId={activeProject.projectId}
          currentName={activeProject.projectName}
        />
      )}
    </>
  );
}