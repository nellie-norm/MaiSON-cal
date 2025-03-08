CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, seller_id, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_property ON availability(property_id);
CREATE INDEX IF NOT EXISTS idx_availability_seller ON availability(seller_id); 