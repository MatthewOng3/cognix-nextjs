-- Migration: create user_production_deployment table
-- Tracks production deployment state and history per project

CREATE TABLE user_production_deployment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    
    -- Dokku app state machine: 'none' | 'created' | 'ready'
    prod_dokku_status   TEXT NOT NULL DEFAULT 'none' CHECK (prod_dokku_status IN ('none', 'created', 'ready')),
    prod_app_name       TEXT,
    prod_url            TEXT,

    -- Latest deploy outcome
    last_deploy_status  TEXT CHECK (last_deploy_status IN ('success', 'failed', 'in_progress')),
    last_deploy_at      TIMESTAMPTZ,
    last_deploy_error   TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One production deployment record per project
CREATE UNIQUE INDEX idx_user_production_deployment_project_id 
    ON user_production_deployment(project_id);

-- Fast lookup by project
CREATE INDEX idx_user_production_deployment_project_id_lookup
    ON user_production_deployment(project_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_production_deployment_updated_at
    BEFORE UPDATE ON user_production_deployment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE user_production_deployment ENABLE ROW LEVEL SECURITY;
