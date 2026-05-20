-- Migration 002: Pivot to 2-agent focused SaaS
-- Agents: Customer Support (Gmail auto-reply) + LinkedIn Poster

-- Update agent_type enum: remove 'marketing', add 'linkedin_poster'
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'linkedin_poster';

-- Update platform_type enum: we keep gmail and linkedin, remove usage of instagram/shopify
-- Note: PostgreSQL doesn't support removing enum values, so we leave them but won't use them

-- Knowledge Base table (for customer support auto-replies)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Drafts table (for LinkedIn poster approval workflow)
CREATE TABLE IF NOT EXISTS post_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_employees(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    topics TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'rejected')),
    scheduled_for TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    posted_at TIMESTAMPTZ,
    linkedin_post_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LinkedIn Agent Config table (topics, style, schedule)
CREATE TABLE IF NOT EXISTS linkedin_agent_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID UNIQUE NOT NULL REFERENCES ai_employees(id) ON DELETE CASCADE,
    topics TEXT[] DEFAULT '{}',
    posting_style VARCHAR(50) DEFAULT 'professional',
    tone VARCHAR(50) DEFAULT 'informative',
    posting_frequency VARCHAR(50) DEFAULT 'daily',
    preferred_time TIME DEFAULT '09:00',
    include_hashtags BOOLEAN DEFAULT true,
    max_length INTEGER DEFAULT 1300,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_org ON knowledge_base(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_post_drafts_org ON post_drafts(org_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_agent ON post_drafts(agent_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_status ON post_drafts(status);
CREATE INDEX IF NOT EXISTS idx_post_drafts_scheduled ON post_drafts(scheduled_for);

-- Triggers
CREATE TRIGGER trg_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_post_drafts_updated_at BEFORE UPDATE ON post_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_linkedin_agent_config_updated_at BEFORE UPDATE ON linkedin_agent_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
