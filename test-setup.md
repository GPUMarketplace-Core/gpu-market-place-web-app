# Testing the Find Provider Page

## Quick Test Steps

### 1. Start the Server
```bash
npm run dev
```

### 2. Create Test Data (Manual Database Setup)

You need to manually insert test data into your database. Connect to PostgreSQL and run:

```sql
-- Create two test provider users
INSERT INTO users (id, email, role, display_name) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'provider1@test.com', 'provider', 'GPU Farm Alpha'),
('550e8400-e29b-41d4-a716-446655440002', 'provider2@test.com', 'provider', 'Cloud GPU Beta');

-- Create provider records
INSERT INTO providers (user_id, company_name, rating_avg, rating_count) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Alpha GPU Solutions', 4.5, 123),
('550e8400-e29b-41d4-a716-446655440002', 'Beta Cloud Computing', 4.2, 87);

-- Create test nodes (online status)
INSERT INTO nodes (id, owner_user_id, name, os, region, status, last_heartbeat_at) VALUES 
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Alpha Node 1', 'Ubuntu 22.04', 'us-west-1', 'online', NOW()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Alpha Node 2', 'Ubuntu 22.04', 'us-east-1', 'online', NOW()),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Beta Node 1', 'Ubuntu 20.04', 'eu-west-1', 'online', NOW());
```

### 3. Add GPU Specs to MongoDB

Connect to MongoDB and add node specifications:

```javascript
// Connect to MongoDB
use gpu_marketplace

// Add GPU specs for the test nodes
db.node_specs.insertMany([
  {
    node_id: "660e8400-e29b-41d4-a716-446655440001",
    gpus: [
      {
        vendor: "NVIDIA",
        model: "RTX 4090",
        vram_gb: 24,
        count: 2,
        hourly_price_cents: 350
      }
    ],
    cpu: { model: "AMD Ryzen 9 7950X", cores: 16 },
    memory_gb: 128,
    storage: [{ type: "nvme", size_gb: 2000 }],
    updated_at: new Date()
  },
  {
    node_id: "660e8400-e29b-41d4-a716-446655440002",
    gpus: [
      {
        vendor: "NVIDIA", 
        model: "RTX 4080",
        vram_gb: 16,
        count: 1,
        hourly_price_cents: 250
      }
    ],
    cpu: { model: "Intel i9-13900K", cores: 24 },
    memory_gb: 64,
    storage: [{ type: "nvme", size_gb: 1000 }],
    updated_at: new Date()
  },
  {
    node_id: "660e8400-e29b-41d4-a716-446655440003",
    gpus: [
      {
        vendor: "NVIDIA",
        model: "RTX 4090", 
        vram_gb: 24,
        count: 4,
        hourly_price_cents: 320
      }
    ],
    cpu: { model: "AMD Threadripper 7980X", cores: 64 },
    memory_gb: 256,
    storage: [{ type: "nvme", size_gb: 4000 }],
    updated_at: new Date()
  }
])
```

### 4. Test the Application

1. **Open browser**: Go to `http://localhost:3000`
2. **Sign up as consumer**: Use Google OAuth, select "Consumer" role
3. **Should redirect**: After signup, you'll be redirected to `/find-providers`
4. **Verify data**: You should see 2 providers with their GPU specs and pricing

### 5. Expected Results

You should see:
- **Alpha GPU Solutions**: 2 nodes online, RTX 4090 ($3.50/hr) and RTX 4080 ($2.50/hr)
- **Beta Cloud Computing**: 1 node online, 4x RTX 4090 ($3.20/hr each)
- **Ratings**: 4.5★ (123 reviews) and 4.2★ (87 reviews)
- **Regions**: us-west-1, us-east-1, eu-west-1

## Alternative: Quick API Test

Test the API directly:
```bash
curl http://localhost:3000/api/providers?status=online
```

This should return the provider data with GPU specs and pricing.