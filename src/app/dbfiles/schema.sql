-- OpenGPU Marketplace

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('consumer', 'provider', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE provider_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE node_status AS ENUM ('online', 'offline', 'draining');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('queued', 'scheduled', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'active', 'completed', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,
    role            user_role NOT NULL DEFAULT 'consumer',
    display_name    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status              provider_status NOT NULL DEFAULT 'active',
    rating_avg          NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    rating_count        INTEGER NOT NULL DEFAULT 0,
    payout_account_id   TEXT,
    company_name        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consumers
CREATE TABLE IF NOT EXISTS consumers (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_currency TEXT DEFAULT 'USD',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nodes
CREATE TABLE IF NOT EXISTS nodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT,
    os              TEXT,
    client_version  TEXT,
    public_ip       INET,
    region          TEXT,
    status          node_status NOT NULL DEFAULT 'offline',
    last_heartbeat_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider_id     UUID REFERENCES users(id) ON DELETE RESTRICT,
    status          order_status NOT NULL DEFAULT 'pending',
    currency        TEXT NOT NULL DEFAULT 'USD',
    subtotal_cents  INTEGER NOT NULL DEFAULT 0,
    fees_cents      INTEGER NOT NULL DEFAULT 0,
    total_cents     INTEGER GENERATED ALWAYS AS (subtotal_cents + fees_cents) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    node_id         UUID REFERENCES nodes(id) ON DELETE SET NULL,
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    status          job_status NOT NULL DEFAULT 'queued',
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    config_ref      TEXT, -- Mongo job_configs id
    artifacts_ref   TEXT, -- S3/IPFS/Mongo
    failure_reason  TEXT
);

-- Job Runs
CREATE TABLE IF NOT EXISTS job_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    attempt_no      INTEGER NOT NULL,
    status          job_status NOT NULL,
    node_id         UUID REFERENCES nodes(id) ON DELETE SET NULL,
    logs_ref        TEXT, -- Mongo job_logs id
    metrics_ref     TEXT, -- Mongo job_metrics id
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    UNIQUE(job_id, attempt_no)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status          payment_status NOT NULL DEFAULT 'pending',
    gateway         TEXT NOT NULL DEFAULT 'stripe',
    gateway_payment_intent_id TEXT UNIQUE,
    amount_cents    INTEGER NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'USD',
    captured_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rater_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ratee_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(order_id, rater_id)
);
