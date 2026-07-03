ALTER TABLE agent_tasks
ADD COLUMN thread_id UUID DEFAULT gen_random_uuid();
