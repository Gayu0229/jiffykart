-- Migration: V48__add_rejection_reason_to_return_requests.sql
-- Description: Add rejection_reason column to return_requests table

ALTER TABLE public.return_requests 
ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255);
