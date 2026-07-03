-- Beta configuration table (singleton row)
-- Allows controlling beta access from Supabase dashboard without redeploying
CREATE TABLE IF NOT EXISTS beta_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_open BOOLEAN NOT NULL DEFAULT true,
    max_capacity_usd NUMERIC NOT NULL DEFAULT 100.00,
    credits_per_user_usd NUMERIC NOT NULL DEFAULT 15.00,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    round_name TEXT DEFAULT 'round-1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the default configuration for the first beta round
INSERT INTO beta_config(id, is_open, max_capacity_usd, credits_per_user_usd, start_date, round_name)
VALUES (1, true, 100.00, 15.00, '2026-02-15T00:00:00Z', 'round-1')
ON CONFLICT (id) DO NOTHING;
