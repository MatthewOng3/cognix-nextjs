CREATE TABLE project_build_run (
    "id" BIGSERIAL PRIMARY KEY,
    "project_id" "uuid" NOT NULL REFERENCES "public"."project"("project_id") ON DELETE CASCADE,
    "thread_id" "uuid" NOT NULL,
    "status" "text" NOT NULL CHECK ("status" IN ('completed', 'failed', 'cancelled')),
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "duration_ms" BIGINT,
    "error_message" TEXT,
    "total_cost" NUMERIC,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE INDEX "idx_project_build_run_project_id" ON "project_build_run" ("project_id");
CREATE INDEX "idx_project_build_run_thread_id" ON "project_build_run" ("thread_id");
CREATE INDEX "idx_project_build_run_status" ON "project_build_run" ("status");

ALTER TABLE chat_history
ADD COLUMN thread_id UUID;