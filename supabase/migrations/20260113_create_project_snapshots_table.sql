CREATE TABLE project_webcontainer_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    deps_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_id ON project_webcontainer_snapshots(project_id);