// import { createSupabaseAdminClient } from "./server";

// const supabase = createSupabaseAdminClient()

// /**
//  * Create a new project
//  */
// export async function createProject(projectName: string, description?: string) {
//   // Get the current user from the session
//   //const { data: { user } } = await supabase.auth.getUser()

//   // if (!user) {
//   //   throw new Error('User must be authenticated to create a project')
//   // }

//   const { data, error } = await supabase
//     .from("projects")
//     .insert({
//       project_name: projectName,
//       description: description || `Project: ${projectName}`,
//       user_id: 1,
//       created_at: new Date().toISOString(),
//     })
//     .select();

//   console.log(data, error);
//   return { data, error };
// }

// /**
//  * Get user's projects
//  */
// export async function getUserProjects(userId: string) {
//   const { data, error } = await supabase.rpc("get_user_projects", {
//     user_id: userId,
//   });

//   return { data, error };
// }

// /**
//  * Update project status
//  */
// export async function updateProjectStatus(
//   projectId: string,
//   status: "active" | "draft" | "deployed",
// ) {
//   const { data, error } = await supabase.rpc("update_project_status", {
//     project_id: projectId,
//     new_status: status,
//   });

//   return { data, error };
// }

// /**
//  * Get project statistics
//  */
// export async function getProjectStats(projectId: string) {
//   const { data, error } = await supabase.rpc("get_project_stats", {
//     project_id: projectId,
//   });

//   return { data, error };
// }

// /**
//  * Example of calling a custom RPC function with multiple parameters
//  */
// export async function customRpcExample(
//   param1: string,
//   param2: number,
//   param3: boolean,
// ) {
//   const { data, error } = await supabase.rpc("your_custom_function", {
//     param1,
//     param2,
//     param3,
//   });

//   return { data, error };
// }
