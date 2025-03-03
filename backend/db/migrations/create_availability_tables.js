const createTables = `
-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    address TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sellers table
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Property-Seller relationship table
CREATE TABLE IF NOT EXISTS property_sellers (
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, seller_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure end_time is after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indices for common queries
CREATE INDEX IF NOT EXISTS idx_availability_property ON availability(property_id);
CREATE INDEX IF NOT EXISTS idx_availability_seller ON availability(seller_id);
CREATE INDEX IF NOT EXISTS idx_availability_times ON availability(start_time, end_time);
`;

module.exports = {
  up: async (client) => {
    return client.query(createTables);
  },
  down: async (client) => {
    return client.query(`
      DROP TABLE IF EXISTS availability;
      DROP TABLE IF EXISTS property_sellers;
      DROP TABLE IF EXISTS sellers;
      DROP TABLE IF EXISTS properties;
    `);
  }
};