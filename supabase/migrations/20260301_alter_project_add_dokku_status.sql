ALTER TABLE project ADD COLUMN dokku_status TEXT DEFAULT 'pending' 
  CHECK (dokku_status IN ('pending', 'ready', 'failed'));