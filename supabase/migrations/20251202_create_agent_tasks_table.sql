-- Enum for "type" field
CREATE TYPE task_type AS ENUM ('Backend', 'Frontend', 'Fullstack');

-- Unified tasks table
CREATE TABLE agent_tasks (
    -- Primary key auto-increment
    id BIGSERIAL PRIMARY KEY,

    -- Public UUID for external use (e.g., LLM IDs)
    task_id UUID NOT NULL DEFAULT gen_random_uuid(),
    type task_type NOT NULL,
    instructions TEXT NOT NULL,

    -- Parent task relation uses integer PK
    parent_task_id BIGINT REFERENCES agent_tasks(id) ON DELETE CASCADE,
    
    -- context object: task_context, file_dependencies
    context JSONB,

    -- contract: api_endpoint + request_schema + response_schema
    contract JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Useful indexes
CREATE INDEX idx_agent_tasks_id ON agent_tasks(id);
