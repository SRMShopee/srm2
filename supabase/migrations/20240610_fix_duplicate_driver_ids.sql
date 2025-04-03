-- Add a unique constraint to driver_id to prevent duplicates in the future
ALTER TABLE users
ADD CONSTRAINT unique_driver_id UNIQUE (driver_id);