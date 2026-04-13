-- =====================================================
-- SEED DATA FOR TESTING
-- =====================================================
-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT INTO users (username, email, password_hash, role, department)
VALUES (
        'admin',
        'admin@mcd.gov.in',
        '$2a$10$rOzXQCfFN7IoNLKl06wqluBk3B7LYLqM.xD7jQxXxP5l4GZqcxGOO',
        'admin',
        'Infrastructure'
    ),
    (
        'officer1',
        'officer1@mcd.gov.in',
        '$2a$10$rOzXQCfFN7IoNLKl06wqluBk3B7LYLqM.xD7jQxXxP5l4GZqcxGOO',
        'officer',
        'Enforcement'
    ),
    (
        'contractor1',
        'contractor1@example.com',
        '$2a$10$rOzXQCfFN7IoNLKl06wqluBk3B7LYLqM.xD7jQxXxP5l4GZqcxGOO',
        'contractor',
        NULL
    );
-- Insert parking zones
INSERT INTO parking_zones (
        name,
        location_name,
        location_lat,
        location_lng,
        max_capacity,
        reserved_slots,
        grace_threshold,
        contractor_id,
        fine_per_excess
    )
VALUES (
        'Connaught Place Block A',
        'Connaught Place, New Delhi',
        28.6328,
        77.2197,
        50,
        5,
        3,
        (
            SELECT id
            FROM users
            WHERE username = 'contractor1'
        ),
        500
    ),
    (
        'Lajpat Nagar Market',
        'Lajpat Nagar, South Delhi',
        28.5677,
        77.2433,
        75,
        10,
        5,
        (
            SELECT id
            FROM users
            WHERE username = 'contractor1'
        ),
        500
    ),
    (
        'Rohini Sector-7 Hub',
        'Rohini, North-West Delhi',
        28.7025,
        77.1125,
        100,
        15,
        5,
        (
            SELECT id
            FROM users
            WHERE username = 'contractor1'
        ),
        500
    ),
    (
        'Saket Select Citywalk',
        'Saket, South Delhi',
        28.5244,
        77.2066,
        120,
        20,
        8,
        (
            SELECT id
            FROM users
            WHERE username = 'contractor1'
        ),
        600
    ),
    (
        'Dwarka Sector-21 Metro',
        'Dwarka, South-West Delhi',
        28.5522,
        77.0580,
        80,
        8,
        5,
        (
            SELECT id
            FROM users
            WHERE username = 'contractor1'
        ),
        500
    );
-- Initialize live occupancy for all zones
INSERT INTO live_occupancy (zone_id, current_count, reserved_count)
SELECT id,
    FLOOR(RANDOM() * max_capacity * 0.8)::INTEGER as current_count,
    reserved_slots
FROM parking_zones;
-- Insert some sample revenue logs
INSERT INTO revenue_logs (date, zone_id, amount, source)
SELECT CURRENT_DATE - (RANDOM() * 30)::INTEGER,
    z.id,
    (RANDOM() * 5000 + 1000)::DECIMAL(10, 2),
    'violation'
FROM parking_zones z,
    generate_series(1, 5) gs;
-- Update system health
UPDATE system_health
SET total_zones_active = (
        SELECT COUNT(*)
        FROM parking_zones
        WHERE status = 'active'
    ),
    total_violations_today = 0,
    last_sync = NOW();