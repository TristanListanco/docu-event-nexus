
-- Add support for multi-day events by adding an end_date column to the events table
ALTER TABLE events ADD COLUMN end_date date;

-- Update existing events to have end_date same as date (single day events)
UPDATE events SET end_date = date WHERE end_date IS NULL;

-- Make end_date NOT NULL after setting default values
ALTER TABLE events ALTER COLUMN end_date SET NOT NULL;
