-- AgentAssist Database Schema
-- PostgreSQL (Supabase compatible)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Real Estate Agents)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier VARCHAR(50) DEFAULT 'free' -- free, pro, enterprise
);

-- CRM Connections (encrypted credentials)
CREATE TABLE crm_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crm_provider VARCHAR(50) NOT NULL, -- 'followupboss', 'kvcore', 'liondesk', etc.
    
    -- Encrypted credentials (AES-256-GCM)
    encrypted_credentials TEXT NOT NULL, -- JSON blob: {api_key, access_token, refresh_token, etc.}
    encryption_iv VARCHAR(64) NOT NULL, -- Initialization vector for decryption
    
    -- OAuth metadata
    oauth_state VARCHAR(255),
    oauth_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Connection status
    is_connected BOOLEAN DEFAULT FALSE,
    last_validated_at TIMESTAMP WITH TIME ZONE,
    validation_error TEXT,
    
    -- Sync metadata
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency_minutes INT DEFAULT 15,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, crm_provider)
);

-- User Settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- AI Agent Settings
    autopilot_enabled BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50) DEFAULT 'gpt-4-turbo',
    ai_temperature FLOAT DEFAULT 0.7,
    
    -- Lead Follow-up Settings
    followup_enabled BOOLEAN DEFAULT TRUE,
    followup_lead_statuses JSONB DEFAULT '["New", "Attempted Contact"]'::jsonb,
    followup_lead_tags JSONB DEFAULT '["Zillow Lead"]'::jsonb,
    followup_message_template TEXT,
    
    -- Social Media Settings
    social_enabled BOOLEAN DEFAULT FALSE,
    instagram_connected BOOLEAN DEFAULT FALSE,
    facebook_connected BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads (cached from CRM for faster queries)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crm_connection_id UUID NOT NULL REFERENCES crm_connections(id) ON DELETE CASCADE,
    
    -- CRM data
    crm_lead_id VARCHAR(255) NOT NULL, -- The ID in the external CRM
    crm_lead_status VARCHAR(100),
    
    -- Lead details
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    price_range_min INT,
    price_range_max INT,
    location VARCHAR(255),
    tags JSONB,
    
    -- Activity
    last_activity_at TIMESTAMP WITH TIME ZONE,
    last_contact_method VARCHAR(50), -- 'email', 'sms', 'call'
    
    -- Sync metadata
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(crm_connection_id, crm_lead_id)
);

-- Pending Messages (The "Approval Gate")
CREATE TABLE pending_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Message content
    message_type VARCHAR(20) NOT NULL, -- 'email' or 'sms'
    subject VARCHAR(500), -- For emails
    body TEXT NOT NULL,
    
    -- AI metadata
    generated_by_model VARCHAR(50),
    generation_prompt TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'sent', 'failed'
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- User edits
    was_edited BOOLEAN DEFAULT FALSE,
    original_body TEXT, -- Store original if edited
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pending_messages_user_status ON pending_messages(user_id, status);
CREATE INDEX idx_pending_messages_created ON pending_messages(created_at DESC);

-- Message Log (All sent messages)
CREATE TABLE message_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    pending_message_id UUID REFERENCES pending_messages(id) ON DELETE SET NULL,
    
    -- Message details
    message_type VARCHAR(20) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    
    -- Delivery status
    status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'failed', 'bounced'
    error_message TEXT,
    
    -- CRM logging
    crm_note_created BOOLEAN DEFAULT FALSE,
    crm_note_id VARCHAR(255),
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_message_log_user ON message_log(user_id, sent_at DESC);
CREATE INDEX idx_message_log_lead ON message_log(lead_id, sent_at DESC);

-- Social Posts
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Post content
    caption TEXT NOT NULL,
    hashtags TEXT[],
    image_urls TEXT[] NOT NULL,
    
    -- AI generation
    generated_caption BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50),
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'posting', 'posted', 'failed'
    
    -- Platform delivery
    post_to_instagram BOOLEAN DEFAULT TRUE,
    instagram_post_id VARCHAR(255),
    instagram_posted_at TIMESTAMP WITH TIME ZONE,
    
    post_to_facebook BOOLEAN DEFAULT TRUE,
    facebook_post_id VARCHAR(255),
    facebook_posted_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    retry_count INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_social_posts_user_scheduled ON social_posts(user_id, scheduled_for);
CREATE INDEX idx_social_posts_status ON social_posts(status, scheduled_for);

-- Activity Log (Audit trail)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- 'crm_connected', 'message_sent', 'autopilot_enabled', etc.
    entity_type VARCHAR(50), -- 'lead', 'message', 'social_post', 'crm_connection'
    entity_id UUID,
    
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Background Jobs Queue
CREATE TABLE job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    job_type VARCHAR(50) NOT NULL, -- 'lead_sync', 'message_send', 'social_post', etc.
    payload JSONB NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INT DEFAULT 0, -- Higher = more urgent
    
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status_scheduled ON job_queue(status, scheduled_for);
CREATE INDEX idx_job_queue_user ON job_queue(user_id, created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_connections_updated_at BEFORE UPDATE ON crm_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_messages_updated_at BEFORE UPDATE ON pending_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
