-- Create coupon_codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    token_amount INTEGER NOT NULL,
    description VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Create coupon_redemptions table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    coupon_id INTEGER NOT NULL REFERENCES coupon_codes(id),
    redeemed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_coupon 
ON coupon_redemptions(user_id, coupon_id);

-- Insert coupon 1000FoilWar
INSERT INTO coupon_codes (code, token_amount, description, is_active, created_at)
VALUES ('1000FoilWar', 1000, 'Coupon promozionale 1000 token', true, NOW())
ON CONFLICT (code) DO NOTHING;
