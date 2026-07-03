CREATE TABLE user_production_deployment_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    
    image_tag           TEXT NOT NULL,
    deploy_status       TEXT CHECK (deploy_status IN ('success', 'failed', 'in_progress')),
    
    deploy_started_at   TIMESTAMPTZ DEFAULT NOW(),
    deploy_finished_at  TIMESTAMPTZ,
    
    error_message       TEXT,


    created_at          TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE user_production_deployment_history ENABLE ROW LEVEL SECURITY;