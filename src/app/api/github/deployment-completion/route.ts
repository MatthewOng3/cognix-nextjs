import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { ProjectDeploymentSchema } from "@/app/lib/util/supabase/types/tables";
 
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Callback route after user project authorizes Supabase integration, updates project integration row
 * with the respective tokens. 
 * @route api/github/deployment-completion
 * @returns 
 */
export async function POST(req: NextRequest) {
    try{
        const supabase = createSupabaseAdminClient();

        const body = await req.json();
        const {
            status,
            isSuccessful,
            gitSha,
            actionError,
        } = body;
        
        //Grab necessary metadata from project deployment row using git sha value
        const { data: deploymentData, error:getError } = await supabase.from("project_deployment")
        .select('*')
        .eq("git_sha", gitSha)
        .single<ProjectDeploymentSchema>();
 
        if(getError || !deploymentData){
            throw new Error(`Error retrieving Github deployment row from supabase: ${getError}`)
        }

        const updateFields: Partial<ProjectDeploymentSchema> = {
            status,
            is_successful: isSuccessful
        };
      
        // Mark finished time if success/failed
        updateFields.finished_at = new Date().toISOString();
      
        //If error with github deployment
        if (actionError) {
            updateFields.error_message = actionError;
        }

        const {  error:updateError } = await supabase.from("project_deployment")
        .update(updateFields)
        .eq("git_sha", gitSha)
        .eq("project_id", deploymentData.project_id)
        .eq("session_id", deploymentData.session_id)
        .single<ProjectDeploymentSchema>();
        
        console.log("In Github Deployment Completion, Updated project deployment status", updateFields)
        if(updateError){
            throw new Error(`Error updating project deployment result in supabase: ${updateError.message}`)
        }

        return NextResponse.json({ok: true});
    }
    catch(err){
        console.log("Error with github deployment completion", err)
        return NextResponse.json(
            { ok: false, error: `Failed to process supabase OAuth callback. ${err}` },
            { status: 500 },
        );
    }
  }