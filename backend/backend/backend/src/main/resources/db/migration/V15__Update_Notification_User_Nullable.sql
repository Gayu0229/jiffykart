-- V15: Make notification user_id nullable for role-based broadcasts
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;
