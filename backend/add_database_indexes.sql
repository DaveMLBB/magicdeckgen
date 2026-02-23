-- Performance optimization indexes for MTG card search
-- Run this SQL script on your PostgreSQL database

-- Text search indexes for name columns (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_mtg_cards_name_lower ON mtg_cards (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_mtg_cards_name_it_lower ON mtg_cards (LOWER(name_it));

-- Full-text search indexes (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_mtg_cards_name_trgm ON mtg_cards USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mtg_cards_name_it_trgm ON mtg_cards USING gin (name_it gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mtg_cards_text_trgm ON mtg_cards USING gin (text gin_trgm_ops);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_mtg_cards_colors_types ON mtg_cards (colors, types);
CREATE INDEX IF NOT EXISTS idx_mtg_cards_rarity_mana ON mtg_cards (rarity, mana_value);
CREATE INDEX IF NOT EXISTS idx_mtg_cards_set_rarity ON mtg_cards (set_code, rarity);

-- Partial index for cards with images (most common query)
CREATE INDEX IF NOT EXISTS idx_mtg_cards_with_image ON mtg_cards (name, mana_value) 
WHERE image_url IS NOT NULL AND image_url != '';

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Analyze tables to update statistics
ANALYZE mtg_cards;
