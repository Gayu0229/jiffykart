-- V37: Add delivery and COD configurations to cities

ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS delivery_estimation VARCHAR(100) DEFAULT '30-45 mins',
ADD COLUMN IF NOT EXISTS is_cod_available BOOLEAN DEFAULT true;
