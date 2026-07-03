// "use client";
// import DOMPurify from 'dompurify';
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useCallback, useEffect, useState } from "react";
// import { CreateProjectCard } from "../components/CreateProjectCard";
// import { LoadingOverlay } from "../components/loading-overlay";
// import ProjectCard from "../components/ProjectCard";
// import { UserDropdown } from "../components/UserDropdown";
// import { Button } from "../components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "../components/ui/dialog";
// import { Input } from "../components/ui/input";
// import { useAuth } from "../hooks/use-auth";
// import { useProject } from "../hooks/use-project";
// import { formatRelativeTime } from "../lib/util/functions/date";
// import { createSupabaseClient } from "../lib/util/supabase/client";
// import type {
//   ApiResponse,
//   CreateProjectResponse,
//   FetchProjectsWithChatSessionsResponse,
//   ProjectWithChatSessions,
// } from "../lib/util/types/api";
// import { useUser } from '../hooks/use-user';

// /**
//  * @description Project page where users can view their projects and create new ones
//  * @route /project
//  * @returns
//  */
// function Page() {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [projectName, setProjectName] = useState("");
//   const [isCreating, setIsCreating] = useState(false);
//   const [projects, setProjects] = useState<ProjectWithChatSessions[]>([]);
//   const [isLoadingProjects, setIsLoadingProjects] = useState(true);
//   const [projectsError, setProjectsError] = useState<string | null>(null);
   
//   //Grab user auth object
//   const { user, userId, loading } = useAuth();
//   const { userData, fetchUserInfo } = useUser();
//   const router = useRouter();
//   const { setCurrentProject } = useProject();
//   const supabase = createSupabaseClient();

//   /**
//    * @description Fetch projects for the current user along with respective chat session ids
//    */
//   const fetchProjects = useCallback(async () => {
//     if (!userId) return;

//     setIsLoadingProjects(true);
//     setProjectsError(null);

//     //API call to fetch projects
//     try {
//       const response = await fetch(`/api/projects?userId=${userId}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       const result: ApiResponse<FetchProjectsWithChatSessionsResponse> =
//         await response.json();

//       if (!response.ok) {
//         console.error("Error fetching projects:", result.error);
//         setProjectsError(result.error || "Failed to fetch projects");
//       } else if (result.success && result.data) {
//         setProjects(result.data);
//       }
//     } catch (error) {
//       console.error("Error fetching projects:", error);
//       setProjectsError("Failed to fetch projects");
//     } finally {
//       setIsLoadingProjects(false);
//     }
//   }, [userId]);
  
//   // Fetch projects only when user is authenticated
//   useEffect(() => {
//     if (userId && !loading) {
//       fetchUserInfo();
//       fetchProjects();
//     }
//   }, [userId, loading]);

//   // Additional effect to handle auth state changes
//   // useEffect(() => {
//   // 	if (isAuthenticated && !loading && projects.length === 0 && !isLoadingProjects) {
//   // 		console.log("Re-fetching projects after auth state change");
//   // 		fetchProjects();
//   // 	}
//   // }, [isAuthenticated, loading, projects.length, isLoadingProjects]);

//   /**
//    * @description Handles creation of a new project, sends user to onboarding project
//    */
//   async function handleCreateProject() {
//     //Check if project creation limit has been reached
//     // if (projects.length >= 2) {
//     //   handleCancel();
//     //   showAlert("Project limit reached", "error");
//     //   return;
//     // }

//     if (projectName.trim()) {
//       setIsCreating(true);

//       //Set redux loading to true
//       try {
//         const response = await fetch("/api/projects", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             projectName,
//             userId: userId,
//           }),
//         });

//         const result: ApiResponse<CreateProjectResponse> =
//           await response.json();

//         if (!response.ok) {
// 			// Handle error response
// 			const errorResult = result;
// 			console.error("Error creating project:", errorResult.error);
// 			// You might want to show a toast notification here
//         } else if (result.success && result.data) {
// 			// Store project and chat session data in Redux
// 			setCurrentProject({
// 				projectId: result.data.project.project_id,
// 				projectName: result.data.project.project_name,
// 				description: "",
// 				status: "Draft",
// 				productDocMarkdown: null,
// 				productDocBlocknote: null,
// 				repoId: result.data.project.repo_id,
// 				repoUrl: result.data.project.repo_url,
// 				createdAt: result.data.project.created_at.toString(),
// 				builderSessionId: result.data.chatSession.chat_session_id,
// 				plannerSessionId: result.data.plannerSession.chat_session_id,
// 				generatedPrd: false,
// 				previewUrl: result.data.project.preview_url,
// 			});

// 			// Reset form and close modal
// 			handleCancel();

// 			const projectId = result.data?.project.project_id;
// 			const sessionId = result.data?.plannerSession.chat_session_id
// 			//Go to project onboarding
// 			router.replace(`/project/${projectId}/build?new_project=${true}`);
// 			//router.replace(`/onboarding/project/${projectId}/${sessionId}/product_doc`); //New product onboarding
//         }
//       } catch (error) {
//         console.error("Error creating project:", error);
//       } finally {
//         setIsCreating(false);
//       }
//     }
//   }

//   const handleCancel = () => {
//     setProjectName("");
//     setIsDialogOpen(false);
//   };

//   /**
//    * @description Logout functionality
//    */
//   async function logout() {
//     const { error } = await supabase.auth.signOut();

//     if (error) {
//       console.log("Error Signing Out", error);
//     } else {
//       // Redirect to login page after successful logout
//       router.replace("/auth/login");
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
//       {/* Header */}
//       <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
//         <div className="flex items-center justify-between px-6 py-4">
//           <div className="flex items-center gap-3">
// 			<div className="relative h-8 w-8 flex-shrink-0 bg-red">
// 				<Image
// 					src="/cognix-logo-v3.png"
// 					alt="Cognix Studio Logo"
// 					className="object-contain"
// 					priority
// 					height={50}
// 					width={300}
// 				/>
// 			</div>
//             <h1 className="text-2xl font-bold cognix-gradient-text">
//               Cognix Studio
//             </h1>
//             <span className="text-sm text-muted-foreground">
//               Build apps with AI
//             </span>
//           </div>

//           <div className="flex items-center gap-4">
//             {/*Create project modal*/}
//             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//               <DialogContent className="sm:max-w-[425px]">
//                 <DialogHeader>
//                   <DialogTitle>Create New Project</DialogTitle>
//                   <DialogDescription>
//                     Enter a name for your new project. You can always change
//                     this later.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="grid gap-4 py-4">
//                   <div className="grid gap-2">
//                     <label
//                       htmlFor="project-name"
//                       className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                     >
//                       Project Name
//                     </label>
//                     <Input
//                       id="project-name"
//                       maxLength={100}
//                       placeholder="Enter project name..."
//                       value={projectName}
//                       onChange={(e) => setProjectName(DOMPurify.sanitize(e.target.value))}
//                       onKeyDown={(e) => {
//                         if (e.key === "Enter") {
//                           handleCreateProject();
//                         }
//                       }}
//                     />
//                   </div>
//                 </div>
//                 <DialogFooter>
//                   <Button
//                     variant="outline"
//                     onClick={handleCancel}
//                     className="cursor-pointer"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleCreateProject}
//                     disabled={!projectName.trim() || isCreating}
//                     className="cognix-gradient text-white hover:opacity-90 transition-opacity cursor-pointer"
//                   >
//                     {isCreating ? "Creating..." : "Create Project"}
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>

//             {/* Header Icons*/}
//             {/* <Button
//               variant="ghost"
//               size="icon"
//               className="relative hover:bg-muted"
//             >
//               <Bell className="w-5 h-5" />
//               <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
//             </Button> */}

//             <UserDropdown user={user} onLogout={logout} />
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="flex-1 p-8">
//         <div className="max-w-7xl mx-auto">
//           {/* Welcome Section */}
//           <div className="mb-8">
//             <h2 className="text-3xl font-bold text-foreground mb-2">
//               Welcome back! 👋
//             </h2>
//             <p className="text-lg text-muted-foreground">
//               Continue building amazing applications with AI assistance
//             </p>
//           </div>

//           {/* Quick Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//             <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 cognix-gradient rounded-lg flex items-center justify-center">
//                   <span className="text-white font-bold">
//                     {projects.length}
//                   </span>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">
//                     Total Projects
//                   </p>
//                   <p className="text-lg font-semibold text-foreground">
//                     Active
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/*Collaborator count*/}
//             {/* <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
//                   <span className="text-blue-400 font-bold">1</span>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Collaborators</p>
//                   <p className="text-lg font-semibold text-foreground">Team</p>
//                 </div>
//               </div>
//             </div> */}

//             {/* Displaying how many credits user has left */}
//             <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
//                   <span className="text-purple-400 font-bold">{`${Math.floor(userData.credit_balance * 10) / 10}`}</span>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">
//                     AI Credits Left
//                   </p>
//                   <p className="text-lg font-semibold text-foreground">
//                     Available
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Projects Section */}
//           <div className="mb-6">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-semibold text-foreground">
//                 Your Projects
//               </h3>
//               {/* <div className="flex gap-2">
// 					<button className="px-4 py-2 text-sm bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors">
// 					All Projects
// 					</button>
// 					<button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
// 					Recent
// 					</button>
// 					<button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
// 					Deployed
// 					</button>
// 				</div> */}
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {isCreating && <LoadingOverlay text="Creating Project.." />}
//               <CreateProjectCard setModalState={() => setIsDialogOpen(true)} />

//               {isLoadingProjects ? (
//                 // Loading state
//                 Array.from({ length: 3 }).map((_, index) => (
//                   <div
//                     key={index}
//                     className="bg-card rounded-xl border border-border p-6 animate-pulse"
//                   >
//                     <div className="h-4 bg-muted rounded mb-2"></div>
//                     <div className="h-3 bg-muted rounded mb-4 w-3/4"></div>
//                     <div className="h-3 bg-muted rounded w-1/2"></div>
//                   </div>
//                 ))
//               ) : projectsError ? (
//                 // Error state
//                 <div className="col-span-full text-center py-8">
//                   <p className="text-muted-foreground mb-4">{projectsError}</p>
//                   <Button onClick={fetchProjects} variant="outline">
//                     Try Again
//                   </Button>
//                 </div>
//               ) : projects.length === 0 ? (
//                 // Empty state
//                 <div className="col-span-full text-center py-8">
//                   <p className="text-muted-foreground mb-4">
//                     No projects yet. Create your first project to get started!
//                   </p>
//                 </div>
//               ) : (
//                 // Projects list
//                 projects.map((project) => (
//                   <ProjectCard
//                     key={project.project_id}
//                     id={project.project_id}
//                     name={project.project_name}
//                     description={
//                       project.description || `Project: ${project.project_name}`
//                     }
//                     lastModified={formatRelativeTime(
//                       project.updated_at.toString(),
//                     )}
//                     status={project.status}
//                     collaborators={1}
//                   />
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Recent Activity */}
//           {/* <div className="mt-12">
//             <h3 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h3>
//             <div className="bg-card rounded-xl border border-border p-6">
//               <div className="space-y-4">
//                 {[
//                   { action: "Updated database schema", project: "E-commerce Mobile App", time: "2 hours ago" },
//                   { action: "Added new UI components", project: "Task Management Web App", time: "1 day ago" },
//                   { action: "Deployed to production", project: "AI Chat Assistant", time: "3 days ago" },
//                 ].map((activity, index) => (
//                   <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
//                     <div className="w-2 h-2 rounded-full bg-accent"></div>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium text-foreground">{activity.action}</p>
//                       <p className="text-xs text-muted-foreground">in {activity.project}</p>
//                     </div>
//                     <span className="text-xs text-muted-foreground">{activity.time}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div> */}
//         </div>
//       </main>
//     </div>
//   );
// }

// export default Page;