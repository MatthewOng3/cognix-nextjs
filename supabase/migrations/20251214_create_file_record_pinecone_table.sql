--Logs for file metadata of user projects stored in pinecone vector db.
CREATE TABLE file_record_pinecone (
    -- Primary key auto-increment
    id BIGSERIAL PRIMARY KEY,

    --Id for each record stored in pinecone , attached to each file, combo of project id and file path
    pinecone_record_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.user(user_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    purpose TEXT NOT NULL,
    features TEXT[],
    keywords TEXT[],
    defined_symbols TEXT[],
    dependencies TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);