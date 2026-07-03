-- Add architecture_doc column to project table (markdown text for architecture diagram)
ALTER TABLE "public"."project"
ADD COLUMN IF NOT EXISTS "architecture_doc" text;

-- Update get_complete_project to return architecture_doc
CREATE OR REPLACE FUNCTION "public"."get_complete_project"("project_id_input" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$declare
  result jsonb;
begin
  with session_ids as (
    select
      cs.project_id,
      max(case when cs.chat_type = 'Planner' then cs.chat_session_id::text end) as planner_session_id,
      max(case when cs.chat_type = 'Builder' then cs.chat_session_id::text end) as builder_session_id
    from chat_session cs
    where cs.project_id = project_id_input
    group by cs.project_id
  )
  select jsonb_build_object(
    'projectId', p.project_id,
    'projectName', p.project_name,
    'description', p.description,
    'plannerSessionId', si.planner_session_id,
    'builderSessionId', si.builder_session_id,
    'status', p.status,
    'productDocMarkdown', p.document_markdown,
    'productDocBlocknote', p.document_json,
    'repoId', p.repo_id,
    'repoUrl', p.repo_url,
    'generatedPrd', p.generated_prd,
    'previewUrl', p.preview_url,
    'createdAt', p.created_at,
    'architectureDoc', p.architecture_doc
  )
  into result
  from project p
  left join session_ids si on si.project_id = p.project_id
  where p.project_id = project_id_input
  limit 1;

  return result;
end;$$;
