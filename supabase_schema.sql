-- DEVSecAgent — Supabase PostgreSQL Schema Script
-- Project ID: sqqnexdbecyqmzjqzemu
-- Execute this script in Supabase SQL Editor: https://supabase.com/dashboard/project/sqqnexdbecyqmzjqzemu/sql/new

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table (Email + Hashed Password + Session Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Repositories Table (GitHub Repo Intake)
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(512) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    default_branch VARCHAR(100) DEFAULT 'main',
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_url ON repositories(url);

-- 4. Scans Table (Security Scan Lifecycle & Health Score)
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'QUEUED',
    deployment_target VARCHAR(50) DEFAULT 'Vercel',
    security_score INT DEFAULT 100,
    critical_count INT DEFAULT 0,
    high_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    low_count INT DEFAULT 0,
    total_findings INT DEFAULT 0,
    scan_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scans_repository_id ON scans(repository_id);

-- 5. Findings Table (Normalized Scanner Vulnerability Results)
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    scanner VARCHAR(100) DEFAULT 'semgrep',
    rule_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    confidence VARCHAR(50) DEFAULT 'HIGH',
    file_path VARCHAR(512) NOT NULL,
    start_line INT DEFAULT 1,
    end_line INT DEFAULT 1,
    code_snippet TEXT NOT NULL,
    fingerprint VARCHAR(255),
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- 6. Fix Suggestions Table (Gemini AI Remediation & Unified Diffs)
CREATE TABLE IF NOT EXISTS fix_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    explanation TEXT NOT NULL,
    impact TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    fixed_code TEXT NOT NULL,
    unified_diff TEXT NOT NULL,
    confidence VARCHAR(50) DEFAULT 'HIGH',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fix_suggestions_finding_id ON fix_suggestions(finding_id);
