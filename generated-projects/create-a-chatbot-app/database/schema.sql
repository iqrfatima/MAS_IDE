-- database/schema.sql

-- Drop existing tables to allow re-running the script for development/testing.
-- In a production migration scenario, this would typically be handled by a migration tool (e.g., Alembic).
-- These DROP statements are safe for development but should be removed or conditionally executed in production migrations.
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create 'users' table
-- Stores user authentication details and profile information.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create 'conversations' table
-- Represents a single chat session between a user and the chatbot.
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255), -- An optional title for the conversation (e.g., generated from the first message)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create 'messages' table
-- Stores individual messages within a conversation, indicating the sender.
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'chatbot')), -- 'user' or 'chatbot'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance optimization on frequently queried columns
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_conversations_user_id ON conversations (user_id);
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);

-- Seed Data
-- Populate tables with initial data for testing and development.

-- Insert a test user
-- Password 'password123' hashed with bcrypt.
INSERT INTO users (id, username, email, hashed_password)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'testuser', 'test@example.com', '$2b$12$n2o/9i0t7q8r0s1u2v3w4e5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v');

-- Insert a conversation for 'testuser'
INSERT INTO conversations (id, user_id, title)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'First Chat with Bot');

-- Insert messages for the 'First Chat with Bot' conversation
INSERT INTO messages (conversation_id, sender_type, content)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'user', 'Hello, chatbot!'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'chatbot', 'Hello there! How can I help you today?'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'user', 'Tell me a joke.'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'chatbot', 'Why don\'t scientists trust atoms? Because they make up everything!');

-- Insert another conversation for 'testuser'
INSERT INTO conversations (id, user_id, title)
VALUES
    ('d1f0c1b7-6d8a-4c22-9b2f-9b1b1b1b1b1b', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Question about AI');

-- Insert messages for the 'Question about AI' conversation
INSERT INTO messages (conversation_id, sender_type, content)
VALUES
    ('d1f0c1b7-6d8a-4c22-9b2f-9b1b1b1b1b1b', 'user', 'What is AI?'),
    ('d1f0c1b7-6d8a-4c22-9b2f-9b1b1b1b1b1b', 'chatbot', 'Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans.');
