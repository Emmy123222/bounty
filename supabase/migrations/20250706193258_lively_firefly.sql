/*
  # Create bounties database schema

  1. New Tables
    - `bounties`
      - `id` (text, primary key)
      - `title` (text)
      - `description` (text)
      - `reward` (numeric)
      - `reward_token` (text)
      - `chain` (text)
      - `platform` (text)
      - `category` (text)
      - `difficulty` (text)
      - `deadline` (timestamptz)
      - `claimable` (boolean)
      - `claimed` (boolean)
      - `claimed_by` (text)
      - `requirements` (text[])
      - `submission_url` (text)
      - `contract_address` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `tags` (text[])

    - `users`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique)
      - `chain` (text)
      - `total_earned` (numeric)
      - `total_claimed` (integer)
      - `rank` (integer)
      - `joined_at` (timestamptz)
      - `preferences` (jsonb)

    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `bounty_id` (text)
      - `type` (text)
      - `amount` (numeric)
      - `token` (text)
      - `chain` (text)
      - `tx_hash` (text)
      - `status` (text)
      - `timestamp` (timestamptz)
      - `gas_used` (numeric)
      - `gas_fee` (numeric)

    - `agent_logs`
      - `id` (uuid, primary key)
      - `type` (text)
      - `message` (text)
      - `data` (jsonb)
      - `timestamp` (timestamptz)
      - `user_id` (text)

    - `watchlist`
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `bounty_id` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to bounties

  3. Indexes
    - Add performance indexes for common queries
    - Add full-text search indexes for bounty search
*/

-- Create bounties table
CREATE TABLE IF NOT EXISTS bounties (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  reward numeric DEFAULT 0,
  reward_token text DEFAULT 'USDC',
  chain text NOT NULL,
  platform text NOT NULL,
  category text NOT NULL,
  difficulty text DEFAULT 'intermediate',
  deadline timestamptz,
  claimable boolean DEFAULT true,
  claimed boolean DEFAULT false,
  claimed_by text,
  requirements text[] DEFAULT '{}',
  submission_url text,
  contract_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}'
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  chain text NOT NULL,
  total_earned numeric DEFAULT 0,
  total_claimed integer DEFAULT 0,
  rank integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  preferences jsonb DEFAULT '{
    "autoClaimEnabled": false,
    "notificationsEnabled": true,
    "chains": ["ethereum"],
    "categories": ["development"],
    "minReward": 0,
    "maxReward": 10000
  }'::jsonb
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  bounty_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('claim', 'auto-claim')),
  amount numeric NOT NULL,
  token text NOT NULL,
  chain text NOT NULL,
  tx_hash text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  timestamp timestamptz DEFAULT now(),
  gas_used numeric,
  gas_fee numeric
);

-- Create agent_logs table
CREATE TABLE IF NOT EXISTS agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('scrape', 'claim', 'error', 'notification')),
  message text NOT NULL,
  data jsonb,
  timestamp timestamptz DEFAULT now(),
  user_id text
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  bounty_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, bounty_id)
);

-- Enable Row Level Security
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies for bounties (public read, authenticated users can update claims)
CREATE POLICY "Bounties are viewable by everyone"
  ON bounties FOR SELECT
  USING (true);

CREATE POLICY "Users can update bounty claims"
  ON bounties FOR UPDATE
  USING (true);

-- Create policies for users (users can manage their own data)
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create policies for transactions (users can manage their own transactions)
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create policies for agent_logs (public read for transparency)
CREATE POLICY "Agent logs are viewable by everyone"
  ON agent_logs FOR SELECT
  USING (true);

CREATE POLICY "System can insert agent logs"
  ON agent_logs FOR INSERT
  WITH CHECK (true);

-- Create policies for watchlist (users can manage their own watchlist)
CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can manage their own watchlist"
  ON watchlist FOR ALL
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bounties_chain ON bounties(chain);
CREATE INDEX IF NOT EXISTS idx_bounties_platform ON bounties(platform);
CREATE INDEX IF NOT EXISTS idx_bounties_category ON bounties(category);
CREATE INDEX IF NOT EXISTS idx_bounties_claimable ON bounties(claimable);
CREATE INDEX IF NOT EXISTS idx_bounties_claimed ON bounties(claimed);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_reward ON bounties(reward);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at);

-- Full-text search index for bounties
CREATE INDEX IF NOT EXISTS idx_bounties_search ON bounties USING gin(to_tsvector('english', title || ' ' || description));

-- Indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bounty_id ON transactions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_logs_type ON agent_logs(type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_bounty_id ON watchlist(bounty_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();