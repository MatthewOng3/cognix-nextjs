

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "dev";


ALTER SCHEMA "dev" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
declare
  secret_id uuid;
begin
  -- Call vault.create_secret with project-scoped name
  select vault.create_secret(p_secret_value, p_secret_name, p_description)
  into secret_id;
  
  return secret_id;
end;
$$;


ALTER FUNCTION "public"."create_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_vault_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text" DEFAULT ''::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    secret_id uuid;
    existing_secret RECORD;
BEGIN
    -- 1. Check if secret already exists
    SELECT id, key_id INTO existing_secret
    FROM vault.secrets
    WHERE TRIM(UPPER(name)) = TRIM(UPPER(p_secret_name))
    LIMIT 1;

    IF existing_secret IS NOT NULL THEN
        -- 2a. Update the existing secret
        SELECT vault.update_secret(existing_secret.id, p_secret_value, p_description);
        secret_id := existing_secret.id;
    ELSE
        -- 2b. Secret doesn’t exist → create new
        SELECT vault.create_secret(p_secret_value, p_secret_name, p_description)
        INTO secret_id;
    END IF;

    RETURN secret_id;
END;$$;


ALTER FUNCTION "public"."create_vault_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_integrations"("project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql"
    AS $_$select jsonb_agg(
  jsonb_build_object(
    'integrationId', integration.integration_id,
    'serviceName', integration.service_name,
    'category', integration.category,
    'iconPath', integration.icon_path,
    'description', integration.description,
    'serviceProjectId', project_integration.service_project_id,
    'serviceDashboardUrl', project_integration.service_dashboard_url
  )
) as integrations
from project_integration
join integration 
  on integration.integration_id = project_integration.integration_id
where project_integration.project_id = $1
  and project_integration.is_active = true;$_$;


ALTER FUNCTION "public"."get_active_integrations"("project_id" "uuid") OWNER TO "postgres";


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
    'createdAt', p.created_at
  )
  into result
  from project p
  left join session_ids si on si.project_id = p.project_id
  where p.project_id = project_id_input
  limit 1;

  return result;
end;$$;


ALTER FUNCTION "public"."get_complete_project"("project_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_project_secrets"("p_project_id" "text") RETURNS json
    LANGUAGE "sql"
    AS $$
  select coalesce(
    json_agg(
      json_build_object(
        'secret_name', replace(name, p_project_id || '::', ''),
        'secret_value', decrypted_secret
      )
    ),
    '[]'::json
  )
  from vault.decrypted_secrets
  where name ilike  p_project_id || '::%';
$$;


ALTER FUNCTION "public"."get_user_project_secrets"("p_project_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.user (
    user_id,
    email,
    plan_id,
    is_premium,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    2, -- Default plan ID
    true, -- Default is_premium
    NEW.created_at
  );
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."model_thread_cost"("p_user_id" "text", "p_project_id" "text", "p_thread_id" "text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$BEGIN
    RETURN (
        SELECT COALESCE(SUM(cost),0)
        FROM model_usage_log
         WHERE user_id = p_user_id::uuid
          AND project_id = p_project_id::uuid
          AND thread_id = p_thread_id::uuid
    );
END;$$;


ALTER FUNCTION "public"."model_thread_cost"("p_user_id" "text", "p_project_id" "text", "p_thread_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_project_deployment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  RAISE WARNING 'Trigger fired for project_id: %, operation: %', NEW.project_id, TG_OP;
  PERFORM realtime.broadcast_changes(
    'deployment:' || NEW.project_id::text,
    TG_OP,  -- Operation: INSERT, UPDATE, DELETE
    TG_OP,  -- Event: Same as operation
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."notify_project_deployment"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "dev"."agent_checkpoints" (
    "thread_id" "text" NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "parent_id" "text",
    "state" "jsonb",
    "writes" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interrupt_data" "jsonb"
);


ALTER TABLE "dev"."agent_checkpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dev"."chat_history" (
    "message_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "chat_session_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text",
    "message_component" "jsonb",
    "content_component" "jsonb"
);


ALTER TABLE "dev"."chat_history" OWNER TO "postgres";


ALTER TABLE "dev"."chat_history" ALTER COLUMN "message_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "dev"."chat_history_message_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "dev"."chat_session" (
    "chat_session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "deleted_at" timestamp without time zone,
    "chat_type" "text",
    CONSTRAINT "chat_session_chat_type_check" CHECK (("chat_type" = ANY (ARRAY['Builder'::"text", 'Planner'::"text"])))
);


ALTER TABLE "dev"."chat_session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dev"."integration" (
    "id" bigint NOT NULL,
    "integration_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text",
    "is_active" boolean,
    "description" "text",
    "icon_path" "text"
);


ALTER TABLE "dev"."integration" OWNER TO "postgres";


ALTER TABLE "dev"."integration" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "dev"."integration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "dev"."oauth_pkce" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code_verifier" "text",
    "redirect_uri" "text",
    "project_id" "uuid",
    "integration_id" "uuid",
    "project_name" "text"
);


ALTER TABLE "dev"."oauth_pkce" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dev"."plan" (
    "plan_id" bigint NOT NULL,
    "plan_name" "text" NOT NULL,
    "plan_price" bigint,
    "currency" "text",
    "description" "text",
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone
);


ALTER TABLE "dev"."plan" OWNER TO "postgres";


ALTER TABLE "dev"."plan" ALTER COLUMN "plan_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "dev"."plan_plan_pk_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "dev"."project" (
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_name" "text",
    "description" "text",
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "status" "text",
    "repo_id" "text",
    "repo_url" "text",
    "generated_prd" boolean DEFAULT false,
    "preview_url" "text",
    "document_markdown" "text",
    "document_json" "jsonb",
    "dokku_app_name" "text"
);


ALTER TABLE "dev"."project" OWNER TO "postgres";


COMMENT ON COLUMN "dev"."project"."repo_id" IS 'Repository ID of Github project';



COMMENT ON COLUMN "dev"."project"."repo_url" IS 'URL of the github repository for a project';



CREATE TABLE IF NOT EXISTS "dev"."project_deployment" (
    "id" bigint NOT NULL,
    "project_id" "uuid" NOT NULL,
    "session_id" "text" NOT NULL,
    "git_sha" "text",
    "branch" "text",
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "finished_at" timestamp with time zone,
    "duration_seconds" integer GENERATED ALWAYS AS (EXTRACT(epoch FROM ("finished_at" - "started_at"))) STORED,
    "is_successful" boolean DEFAULT false,
    CONSTRAINT "project_deployments_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Building'::"text", 'Deploying'::"text", 'Success'::"text", 'Failed'::"text"])))
);


ALTER TABLE "dev"."project_deployment" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "dev"."project_deployments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "dev"."project_deployments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "dev"."project_deployments_id_seq" OWNED BY "dev"."project_deployment"."id";



CREATE TABLE IF NOT EXISTS "dev"."project_integration" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" DEFAULT "gen_random_uuid"(),
    "integration_id" "uuid" DEFAULT "gen_random_uuid"(),
    "integration_name" "text",
    "access_token" "text",
    "refresh_token" "text",
    "is_active" boolean DEFAULT false,
    "status" "text",
    "token_expires_in" "text",
    "metadata" "jsonb",
    "repo_id" bigint,
    "thread_id" "text",
    "service_project_id" "text",
    "service_dashboard_url" "text",
    "token_expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "dev"."project_integration" OWNER TO "postgres";


COMMENT ON COLUMN "dev"."project_integration"."thread_id" IS 'Unique thread id identifying which flow in langgraph kicked off the project integration process';



ALTER TABLE "dev"."project_integration" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "dev"."project_integration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "dev"."support" (
    "support_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "request_type" "text",
    "status" "text",
    "content" "text",
    "images" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "dev"."support" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dev"."user" (
    "user_pk" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plan_id" bigint NOT NULL,
    "is_premium" boolean,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "last_login" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "completed_onboarding" boolean DEFAULT false NOT NULL,
    "onboarding_state" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_route" "text"
);


ALTER TABLE "dev"."user" OWNER TO "postgres";


ALTER TABLE "dev"."user" ALTER COLUMN "user_pk" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "dev"."user_user_pk_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."agent_checkpoints" (
    "thread_id" "text" NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "parent_id" "text",
    "state" "jsonb",
    "writes" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interrupt_data" "jsonb"
);


ALTER TABLE "public"."agent_checkpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_history" (
    "message_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "chat_session_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text",
    "message_component" "jsonb",
    "content_component" "jsonb"
);


ALTER TABLE "public"."chat_history" OWNER TO "postgres";


ALTER TABLE "public"."chat_history" ALTER COLUMN "message_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chat_history_message_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_session" (
    "chat_session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "deleted_at" timestamp without time zone,
    "chat_type" "text",
    CONSTRAINT "chat_session_chat_type_check" CHECK (("chat_type" = ANY (ARRAY['Builder'::"text", 'Planner'::"text"])))
);


ALTER TABLE "public"."chat_session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transaction" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "amount" numeric,
    "balance_after" numeric,
    "transaction_type" "text",
    "description" "text",
    "metadata" "jsonb",
    "user_id" "uuid"
);


ALTER TABLE "public"."credit_transaction" OWNER TO "postgres";


ALTER TABLE "public"."credit_transaction" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."credit_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."integration" (
    "id" bigint NOT NULL,
    "integration_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text",
    "is_active" boolean,
    "description" "text",
    "icon_path" "text"
);


ALTER TABLE "public"."integration" OWNER TO "postgres";


ALTER TABLE "public"."integration" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."integration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."model_usage_log" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "thread_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "text" NOT NULL,
    "model_name" "text",
    "input_tokens" bigint,
    "output_tokens" bigint,
    "cost" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL
);


ALTER TABLE "public"."model_usage_log" OWNER TO "postgres";


ALTER TABLE "public"."model_usage_log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."model_usage_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."oauth_pkce" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code_verifier" "text",
    "redirect_uri" "text",
    "project_id" "uuid",
    "integration_id" "uuid",
    "project_name" "text"
);


ALTER TABLE "public"."oauth_pkce" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan" (
    "plan_id" bigint NOT NULL,
    "plan_name" "text" NOT NULL,
    "plan_price" bigint,
    "currency" "text",
    "description" "text",
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."plan" OWNER TO "postgres";


ALTER TABLE "public"."plan" ALTER COLUMN "plan_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."plan_plan_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project" (
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_name" "text",
    "description" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "status" "text",
    "repo_id" "text",
    "repo_url" "text",
    "generated_prd" boolean DEFAULT false,
    "preview_url" "text",
    "document_markdown" "text",
    "document_json" "jsonb",
    "dokku_app_name" "text"
);


ALTER TABLE "public"."project" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project"."repo_id" IS 'Repository ID of Github project';



COMMENT ON COLUMN "public"."project"."repo_url" IS 'URL of the github repository for a project';



CREATE TABLE IF NOT EXISTS "public"."project_deployment" (
    "id" bigint DEFAULT "nextval"('"dev"."project_deployments_id_seq"'::"regclass") NOT NULL,
    "project_id" "uuid" NOT NULL,
    "session_id" "text" NOT NULL,
    "git_sha" "text",
    "branch" "text",
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "finished_at" timestamp with time zone,
    "duration_seconds" integer GENERATED ALWAYS AS (EXTRACT(epoch FROM ("finished_at" - "started_at"))) STORED,
    "is_successful" boolean DEFAULT false,
    CONSTRAINT "project_deployments_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Building'::"text", 'Deploying'::"text", 'Success'::"text", 'Failed'::"text"])))
);


ALTER TABLE "public"."project_deployment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_integration" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" DEFAULT "gen_random_uuid"(),
    "integration_id" "uuid" DEFAULT "gen_random_uuid"(),
    "integration_name" "text",
    "access_token" "text",
    "refresh_token" "text",
    "is_active" boolean DEFAULT false,
    "status" "text",
    "token_expires_in" "text",
    "metadata" "jsonb",
    "repo_id" bigint,
    "thread_id" "text",
    "service_project_id" "text",
    "service_dashboard_url" "text",
    "token_expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_integration" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_integration"."thread_id" IS 'Unique thread id identifying which flow in langgraph kicked off the project integration process';



ALTER TABLE "public"."project_integration" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_integration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."support" (
    "support_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "request_type" "text",
    "status" "text",
    "content" "text",
    "images" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "user_pk" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plan_id" bigint NOT NULL,
    "is_premium" boolean,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "last_login" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "completed_onboarding" boolean DEFAULT false NOT NULL,
    "onboarding_state" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_route" "text",
    "credit_balance" numeric DEFAULT '20'::numeric
);


ALTER TABLE "public"."user" OWNER TO "postgres";


ALTER TABLE "public"."user" ALTER COLUMN "user_pk" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_user_pk_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "dev"."project_deployment" ALTER COLUMN "id" SET DEFAULT "nextval"('"dev"."project_deployments_id_seq"'::"regclass");



ALTER TABLE ONLY "dev"."agent_checkpoints"
    ADD CONSTRAINT "agent_checkpoints_pkey" PRIMARY KEY ("thread_id", "checkpoint_id");



ALTER TABLE ONLY "dev"."chat_history"
    ADD CONSTRAINT "chat_history_message_id_key" UNIQUE ("message_id");



ALTER TABLE ONLY "dev"."chat_session"
    ADD CONSTRAINT "chat_session_pkey" PRIMARY KEY ("chat_session_id");



ALTER TABLE ONLY "dev"."integration"
    ADD CONSTRAINT "integration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dev"."chat_history"
    ADD CONSTRAINT "message_id_primary_key" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "dev"."oauth_pkce"
    ADD CONSTRAINT "oauth_pkce_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dev"."plan"
    ADD CONSTRAINT "plan_pkey" PRIMARY KEY ("plan_id");



ALTER TABLE ONLY "dev"."project_deployment"
    ADD CONSTRAINT "project_deployments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dev"."project_integration"
    ADD CONSTRAINT "project_integration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dev"."project"
    ADD CONSTRAINT "project_pkey" PRIMARY KEY ("project_id");



ALTER TABLE ONLY "dev"."project"
    ADD CONSTRAINT "project_repo_id_key" UNIQUE ("repo_id");



ALTER TABLE ONLY "dev"."support"
    ADD CONSTRAINT "support_pkey" PRIMARY KEY ("support_id");



ALTER TABLE ONLY "dev"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("user_pk");



ALTER TABLE ONLY "dev"."user"
    ADD CONSTRAINT "user_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."agent_checkpoints"
    ADD CONSTRAINT "agent_checkpoints_pkey" PRIMARY KEY ("thread_id", "checkpoint_id");



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_message_id_key" UNIQUE ("message_id");



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."chat_session"
    ADD CONSTRAINT "chat_session_pkey" PRIMARY KEY ("chat_session_id");



ALTER TABLE ONLY "public"."credit_transaction"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration"
    ADD CONSTRAINT "integration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_usage_log"
    ADD CONSTRAINT "model_usage_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_pkce"
    ADD CONSTRAINT "oauth_pkce_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan"
    ADD CONSTRAINT "plan_pkey" PRIMARY KEY ("plan_id");



ALTER TABLE ONLY "public"."project_deployment"
    ADD CONSTRAINT "project_deployment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_integration"
    ADD CONSTRAINT "project_integration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_pkey" PRIMARY KEY ("project_id");



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_repo_id_key" UNIQUE ("repo_id");



ALTER TABLE ONLY "public"."support"
    ADD CONSTRAINT "support_pkey" PRIMARY KEY ("support_id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("user_pk");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_user_id_key" UNIQUE ("user_id");



CREATE OR REPLACE TRIGGER "deployment_trigger" AFTER UPDATE ON "dev"."project_deployment" FOR EACH ROW EXECUTE FUNCTION "public"."notify_project_deployment"();



CREATE OR REPLACE TRIGGER "project_deployment_broadcast_update_trigger" AFTER UPDATE ON "public"."project_deployment" FOR EACH ROW EXECUTE FUNCTION "public"."notify_project_deployment"();



ALTER TABLE ONLY "dev"."chat_history"
    ADD CONSTRAINT "chat_history_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "dev"."chat_session"("chat_session_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "dev"."chat_session"
    ADD CONSTRAINT "chat_session_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev"."project"("project_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "dev"."chat_session"
    ADD CONSTRAINT "chat_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dev"."user"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "dev"."project_deployment"
    ADD CONSTRAINT "project_deployment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev"."project"("project_id") ON DELETE CASCADE;



ALTER TABLE ONLY "dev"."project_integration"
    ADD CONSTRAINT "project_integration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev"."project"("project_id") ON DELETE CASCADE;



ALTER TABLE ONLY "dev"."project"
    ADD CONSTRAINT "project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dev"."user"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "dev"."support"
    ADD CONSTRAINT "support_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dev"."user"("user_id");



ALTER TABLE ONLY "dev"."user"
    ADD CONSTRAINT "user_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "dev"."plan"("plan_id");



ALTER TABLE ONLY "dev"."user"
    ADD CONSTRAINT "user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "public"."chat_session"("chat_session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_session"
    ADD CONSTRAINT "chat_session_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transaction"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_usage_log"
    ADD CONSTRAINT "model_usage_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_usage_log"
    ADD CONSTRAINT "model_usage_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project"
    ADD CONSTRAINT "project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "dev"."agent_checkpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."chat_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."chat_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."integration" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."oauth_pkce" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."plan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."project" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."project_deployment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."project_integration" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."support" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "dev"."user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_checkpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transaction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."model_usage_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_pkce" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_deployment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_integration" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "dev"."project_deployment";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."project_deployment";



GRANT USAGE ON SCHEMA "dev" TO "anon";
GRANT USAGE ON SCHEMA "dev" TO "authenticated";
GRANT USAGE ON SCHEMA "dev" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_vault_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_vault_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_vault_secret"("p_secret_name" "text", "p_secret_value" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_integrations"("project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_integrations"("project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_integrations"("project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_complete_project"("project_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_complete_project"("project_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_complete_project"("project_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_project_secrets"("p_project_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_project_secrets"("p_project_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_project_secrets"("p_project_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."model_thread_cost"("p_user_id" "text", "p_project_id" "text", "p_thread_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."model_thread_cost"("p_user_id" "text", "p_project_id" "text", "p_thread_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."model_thread_cost"("p_user_id" "text", "p_project_id" "text", "p_thread_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_project_deployment"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_project_deployment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_project_deployment"() TO "service_role";












GRANT ALL ON TABLE "dev"."agent_checkpoints" TO "anon";
GRANT ALL ON TABLE "dev"."agent_checkpoints" TO "authenticated";
GRANT ALL ON TABLE "dev"."agent_checkpoints" TO "service_role";



GRANT ALL ON TABLE "dev"."chat_history" TO "anon";
GRANT ALL ON TABLE "dev"."chat_history" TO "authenticated";
GRANT ALL ON TABLE "dev"."chat_history" TO "service_role";



GRANT ALL ON SEQUENCE "dev"."chat_history_message_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "dev"."chat_history_message_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "dev"."chat_history_message_id_seq" TO "service_role";



GRANT ALL ON TABLE "dev"."chat_session" TO "anon";
GRANT ALL ON TABLE "dev"."chat_session" TO "authenticated";
GRANT ALL ON TABLE "dev"."chat_session" TO "service_role";



GRANT ALL ON TABLE "dev"."integration" TO "anon";
GRANT ALL ON TABLE "dev"."integration" TO "authenticated";
GRANT ALL ON TABLE "dev"."integration" TO "service_role";



GRANT ALL ON SEQUENCE "dev"."integration_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "dev"."integration_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "dev"."integration_id_seq" TO "service_role";



GRANT ALL ON TABLE "dev"."oauth_pkce" TO "anon";
GRANT ALL ON TABLE "dev"."oauth_pkce" TO "authenticated";
GRANT ALL ON TABLE "dev"."oauth_pkce" TO "service_role";



GRANT ALL ON TABLE "dev"."plan" TO "anon";
GRANT ALL ON TABLE "dev"."plan" TO "authenticated";
GRANT ALL ON TABLE "dev"."plan" TO "service_role";



GRANT ALL ON SEQUENCE "dev"."plan_plan_pk_seq" TO "anon";
GRANT ALL ON SEQUENCE "dev"."plan_plan_pk_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "dev"."plan_plan_pk_seq" TO "service_role";



GRANT ALL ON TABLE "dev"."project" TO "anon";
GRANT ALL ON TABLE "dev"."project" TO "authenticated";
GRANT ALL ON TABLE "dev"."project" TO "service_role";



GRANT ALL ON TABLE "dev"."project_deployment" TO "anon";
GRANT ALL ON TABLE "dev"."project_deployment" TO "authenticated";
GRANT ALL ON TABLE "dev"."project_deployment" TO "service_role";



GRANT ALL ON SEQUENCE "dev"."project_deployments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "dev"."project_deployments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "dev"."project_deployments_id_seq" TO "service_role";



GRANT ALL ON TABLE "dev"."project_integration" TO "anon";
GRANT ALL ON TABLE "dev"."project_integration" TO "authenticated";
GRANT ALL ON TABLE "dev"."project_integration" TO "service_role";



GRANT ALL ON SEQUENCE "dev"."project_integration_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "dev"."project_integration_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "dev"."project_integration_id_seq" TO "service_role";



GRANT ALL ON TABLE "dev"."support" TO "anon";
GRANT ALL ON TABLE "dev"."support" TO "authenticated";
GRANT ALL ON TABLE "dev"."support" TO "service_role";



GRANT ALL ON TABLE "dev"."user" TO "anon";
GRANT ALL ON TABLE "dev"."user" TO "authenticated";
GRANT ALL ON TABLE "dev"."user" TO "service_role";



GRANT ALL ON SEQUENCE "dev"."user_user_pk_seq" TO "anon";
GRANT ALL ON SEQUENCE "dev"."user_user_pk_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "dev"."user_user_pk_seq" TO "service_role";









GRANT ALL ON TABLE "public"."agent_checkpoints" TO "anon";
GRANT ALL ON TABLE "public"."agent_checkpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_checkpoints" TO "service_role";



GRANT ALL ON TABLE "public"."chat_history" TO "anon";
GRANT ALL ON TABLE "public"."chat_history" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_history_message_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_history_message_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_history_message_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_session" TO "anon";
GRANT ALL ON TABLE "public"."chat_session" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_session" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transaction" TO "anon";
GRANT ALL ON TABLE "public"."credit_transaction" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transaction" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."integration" TO "anon";
GRANT ALL ON TABLE "public"."integration" TO "authenticated";
GRANT ALL ON TABLE "public"."integration" TO "service_role";



GRANT ALL ON SEQUENCE "public"."integration_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."integration_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."integration_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."model_usage_log" TO "anon";
GRANT ALL ON TABLE "public"."model_usage_log" TO "authenticated";
GRANT ALL ON TABLE "public"."model_usage_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."model_usage_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."model_usage_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."model_usage_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."oauth_pkce" TO "anon";
GRANT ALL ON TABLE "public"."oauth_pkce" TO "authenticated";
GRANT ALL ON TABLE "public"."oauth_pkce" TO "service_role";



GRANT ALL ON TABLE "public"."plan" TO "anon";
GRANT ALL ON TABLE "public"."plan" TO "authenticated";
GRANT ALL ON TABLE "public"."plan" TO "service_role";



GRANT ALL ON SEQUENCE "public"."plan_plan_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."plan_plan_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."plan_plan_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project" TO "anon";
GRANT ALL ON TABLE "public"."project" TO "authenticated";
GRANT ALL ON TABLE "public"."project" TO "service_role";



GRANT ALL ON TABLE "public"."project_deployment" TO "anon";
GRANT ALL ON TABLE "public"."project_deployment" TO "authenticated";
GRANT ALL ON TABLE "public"."project_deployment" TO "service_role";



GRANT ALL ON TABLE "public"."project_integration" TO "anon";
GRANT ALL ON TABLE "public"."project_integration" TO "authenticated";
GRANT ALL ON TABLE "public"."project_integration" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_integration_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_integration_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_integration_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."support" TO "anon";
GRANT ALL ON TABLE "public"."support" TO "authenticated";
GRANT ALL ON TABLE "public"."support" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_user_pk_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_user_pk_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_user_pk_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "dev" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

  create policy "authenticated_users_can_receive"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_users_can_send"
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check (true);



