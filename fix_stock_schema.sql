-- Fix stock_movements table schema
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS previous_stock numeric;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS new_stock numeric;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS location text;

-- Change quantity columns to numeric to support decimals (kg, l, etc)
ALTER TABLE stock_movements ALTER COLUMN quantity TYPE numeric;
ALTER TABLE products ALTER COLUMN stock_quantity TYPE numeric;
