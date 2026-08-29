-- Migration to fix malformed email with space for the Field Manager
UPDATE users 
SET email = REPLACE(email, ' ', '') 
WHERE email LIKE '% %' AND role = 'FIELD_MANAGER';
