import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_OHSUd5mWYD3z@ep-floral-night-a1p6xrre-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database schema
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create enums
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE kol_type AS ENUM ('social-media', 'twitter-thread', 'blogger', 'production-talent');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE tier AS ENUM ('Tier 1 (Premium)', 'Tier 2 (Mid-tier)', 'Tier 3 (Emerging)', 'Tier 4 (Micro)');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE gender AS ENUM ('Male', 'Female', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE hair_style AS ENUM ('Hijab', 'Free Hair');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE race AS ENUM ('Malay', 'Chinese', 'Indian', 'Other Asian', 'Caucasian', 'African', 'Mixed Race', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE state AS ENUM ('Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE pic AS ENUM ('Amir', 'Tika', 'Aina');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS niches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kols (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        instagram VARCHAR(500),
        tiktok VARCHAR(500),
        facebook VARCHAR(500),
        twitter VARCHAR(500),
        thread VARCHAR(500),
        blog VARCHAR(500),
        rate DECIMAL(10,2) NOT NULL DEFAULT 0,
        tier tier NOT NULL DEFAULT 'Tier 3 (Emerging)',
        gender gender NOT NULL DEFAULT 'Other',
        hair_style hair_style NOT NULL DEFAULT 'Free Hair',
        race race NOT NULL DEFAULT 'Other',
        address state NOT NULL DEFAULT 'Selangor',
        contact_number VARCHAR(20) NOT NULL,
        submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        rate_details TEXT,
        pic pic NOT NULL DEFAULT 'Amir',
        kol_type kol_type NOT NULL DEFAULT 'social-media',
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kol_niches (
        kol_id INTEGER REFERENCES kols(id) ON DELETE CASCADE,
        niche_id INTEGER REFERENCES niches(id) ON DELETE CASCADE,
        PRIMARY KEY (kol_id, niche_id)
      );
    `);

    // Insert default niches
    await pool.query(`
      INSERT INTO niches (name) VALUES
        ('Fashion & Beauty'),
        ('Lifestyle'),
        ('Food & Dining'),
        ('Travel'),
        ('Technology'),
        ('Fitness & Health'),
        ('Parenting'),
        ('Business & Finance'),
        ('Entertainment'),
        ('Education'),
        ('Sports'),
        ('Automotive'),
        ('Gaming'),
        ('Art & Design'),
        ('Music'),
        ('Comedy'),
        ('News & Politics'),
        ('Religion & Spirituality'),
        ('Pet & Animal'),
        ('Home & Garden')
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
  }
}

// Sample data for migration
const sampleKOLData = [
  {
    name: 'Sarah Ahmad',
    instagram: 'https://instagram.com/sarahahmad',
    tiktok: 'https://tiktok.com/@sarahahmad',
    rate: 2500,
    tier: 'Tier 1 (Premium)',
    gender: 'Female',
    niches: ['Fashion & Beauty', 'Lifestyle'],
    hairStyle: 'Hijab',
    race: 'Malay',
    address: 'Terengganu',
    contactNumber: '+60123456789',
    rateDetails: 'Includes 3 posts + 5 stories + 1 reel',
    pic: 'Tika',
    kolType: 'social-media'
  },
  {
    name: 'David Chen',
    twitter: 'https://twitter.com/davidchen',
    thread: 'https://threads.net/@davidchen',
    rate: 1800,
    tier: 'Tier 2 (Mid-tier)',
    gender: 'Male',
    niches: ['Technology', 'Business & Finance'],
    hairStyle: 'Free Hair',
    race: 'Chinese',
    address: 'Selangor',
    contactNumber: '+60187654321',
    rateDetails: 'Includes 2 tweets + 1 thread post',
    pic: 'Amir',
    kolType: 'twitter-thread'
  }
];

// Migrate sample data
async function migrateSampleData() {
  try {
    // Check if data already exists
    const existingKOLs = await pool.query('SELECT COUNT(*) FROM kols');
    if (parseInt(existingKOLs.rows[0].count) > 0) {
      console.log('Database already contains data, skipping migration');
      return;
    }

    console.log('Starting migration of sample data...');
    
    for (const sampleKOL of sampleKOLData) {
      try {
        // Insert KOL
        const kolResult = await pool.query(`
          INSERT INTO kols (
            name, instagram, tiktok, facebook, twitter, thread, blog,
            rate, tier, gender, hair_style, race, address, contact_number,
            rate_details, pic, kol_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING *
        `, [
          sampleKOL.name, sampleKOL.instagram, sampleKOL.tiktok, null,
          sampleKOL.twitter, sampleKOL.thread, null, sampleKOL.rate,
          sampleKOL.tier, sampleKOL.gender, sampleKOL.hairStyle, sampleKOL.race,
          sampleKOL.address, sampleKOL.contactNumber, sampleKOL.rateDetails,
          sampleKOL.pic, sampleKOL.kolType
        ]);
        
        const newKOL = kolResult.rows[0];
        
        // Insert niches
        if (sampleKOL.niches && sampleKOL.niches.length > 0) {
          for (const nicheName of sampleKOL.niches) {
            // Get or create niche
            let nicheResult = await pool.query(
              'SELECT id FROM niches WHERE name = $1',
              [nicheName]
            );
            
            let nicheId;
            if (nicheResult.rows.length === 0) {
              const newNicheResult = await pool.query(
                'INSERT INTO niches (name) VALUES ($1) RETURNING id',
                [nicheName]
              );
              nicheId = newNicheResult.rows[0].id;
            } else {
              nicheId = nicheResult.rows[0].id;
            }
            
            // Link KOL to niche
            await pool.query(
              'INSERT INTO kol_niches (kol_id, niche_id) VALUES ($1, $2)',
              [newKOL.id, nicheId]
            );
          }
        }
        
        console.log(`Migrated KOL: ${sampleKOL.name}`);
      } catch (error) {
        console.error(`Error migrating KOL ${sampleKOL.name}:`, error);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// API Routes

// Get all KOLs
app.get('/api/kols', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        k.*,
        ARRAY_AGG(n.name) as niches
      FROM kols k
      LEFT JOIN kol_niches kn ON k.id = kn.kol_id
      LEFT JOIN niches n ON kn.niche_id = n.id
      WHERE k.is_active = true
      GROUP BY k.id
      ORDER BY k.created_at DESC
    `);
    
    const kols = result.rows.map(row => ({
      ...row,
      niches: row.niches.filter(niche => niche !== null)
    }));
    
    res.json(kols);
  } catch (error) {
    console.error('Error fetching KOLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get KOLs by type
app.get('/api/kols/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const result = await pool.query(`
      SELECT 
        k.*,
        ARRAY_AGG(n.name) as niches
      FROM kols k
      LEFT JOIN kol_niches kn ON k.id = kn.kol_id
      LEFT JOIN niches n ON kn.niche_id = n.id
      WHERE k.kol_type = $1 AND k.is_active = true
      GROUP BY k.id
      ORDER BY k.created_at DESC
    `, [type]);
    
    const kols = result.rows.map(row => ({
      ...row,
      niches: row.niches.filter(niche => niche !== null)
    }));
    
    res.json(kols);
  } catch (error) {
    console.error('Error fetching KOLs by type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get KOL statistics
app.get('/api/kols/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN kol_type = 'social-media' THEN 1 END) as social_media,
        COUNT(CASE WHEN kol_type = 'twitter-thread' THEN 1 END) as twitter_thread,
        COUNT(CASE WHEN kol_type = 'blogger' THEN 1 END) as blogger,
        COUNT(CASE WHEN kol_type = 'production-talent' THEN 1 END) as production_talent,
        COALESCE(SUM(rate), 0) as total_value,
        COALESCE(AVG(rate), 0) as average_rate
      FROM kols
      WHERE is_active = true
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching KOL stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new KOL
app.post('/api/kols', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const kolData = req.body;
    
    // Insert KOL
    const kolResult = await client.query(`
      INSERT INTO kols (
        name, instagram, tiktok, facebook, twitter, thread, blog,
        rate, tier, gender, hair_style, race, address, contact_number,
        rate_details, pic, kol_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      kolData.name, kolData.instagram, kolData.tiktok, kolData.facebook,
      kolData.twitter, kolData.thread, kolData.blog, kolData.rate,
      kolData.tier, kolData.gender, kolData.hairStyle, kolData.race,
      kolData.address, kolData.contactNumber, kolData.rateDetails,
      kolData.pic, kolData.kolType, kolData.notes
    ]);
    
    const newKOL = kolResult.rows[0];
    
    // Insert niches
    if (kolData.niches && kolData.niches.length > 0) {
      for (const nicheName of kolData.niches) {
        // Get or create niche
        let nicheResult = await client.query(
          'SELECT id FROM niches WHERE name = $1',
          [nicheName]
        );
        
        let nicheId;
        if (nicheResult.rows.length === 0) {
          const newNicheResult = await client.query(
            'INSERT INTO niches (name) VALUES ($1) RETURNING id',
            [nicheName]
          );
          nicheId = newNicheResult.rows[0].id;
        } else {
          nicheId = nicheResult.rows[0].id;
        }
        
        // Link KOL to niche
        await client.query(
          'INSERT INTO kol_niches (kol_id, niche_id) VALUES ($1, $2)',
          [newKOL.id, nicheId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Return the complete KOL with niches
    const completeKOL = await pool.query(`
      SELECT 
        k.*,
        ARRAY_AGG(n.name) as niches
      FROM kols k
      LEFT JOIN kol_niches kn ON k.id = kn.kol_id
      LEFT JOIN niches n ON kn.niche_id = n.id
      WHERE k.id = $1
      GROUP BY k.id
    `, [newKOL.id]);
    
    res.status(201).json(completeKOL.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating KOL:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get KOL by ID
app.get('/api/kols/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        k.*,
        ARRAY_AGG(n.name) as niches
      FROM kols k
      LEFT JOIN kol_niches kn ON k.id = kn.kol_id
      LEFT JOIN niches n ON kn.niche_id = n.id
      WHERE k.id = $1 AND k.is_active = true
      GROUP BY k.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KOL not found' });
    }
    
    const kol = result.rows[0];
    kol.niches = kol.niches.filter(niche => niche !== null);
    
    res.json(kol);
  } catch (error) {
    console.error('Error fetching KOL by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update KOL
app.put('/api/kols/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const kolData = req.body;
    
    // Update KOL
    const updateResult = await client.query(`
      UPDATE kols SET
        name = $1, instagram = $2, tiktok = $3, facebook = $4,
        twitter = $5, thread = $6, blog = $7, rate = $8,
        tier = $9, gender = $10, hair_style = $11, race = $12,
        address = $13, contact_number = $14, rate_details = $15,
        pic = $16, kol_type = $17, notes = $18, updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
    `, [
      kolData.name, kolData.instagram, kolData.tiktok, kolData.facebook,
      kolData.twitter, kolData.thread, kolData.blog, kolData.rate,
      kolData.tier, kolData.gender, kolData.hairStyle, kolData.race,
      kolData.address, kolData.contactNumber, kolData.rateDetails,
      kolData.pic, kolData.kolType, kolData.notes, id
    ]);
    
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'KOL not found' });
    }
    
    // Remove existing niche links
    await client.query('DELETE FROM kol_niches WHERE kol_id = $1', [id]);
    
    // Insert new niches
    if (kolData.niches && kolData.niches.length > 0) {
      for (const nicheName of kolData.niches) {
        // Get or create niche
        let nicheResult = await client.query(
          'SELECT id FROM niches WHERE name = $1',
          [nicheName]
        );
        
        let nicheId;
        if (nicheResult.rows.length === 0) {
          const newNicheResult = await client.query(
            'INSERT INTO niches (name) VALUES ($1) RETURNING id',
            [nicheName]
          );
          nicheId = newNicheResult.rows[0].id;
        } else {
          nicheId = nicheResult.rows[0].id;
        }
        
        // Link KOL to niche
        await client.query(
          'INSERT INTO kol_niches (kol_id, niche_id) VALUES ($1, $2)',
          [id, nicheId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Return the updated KOL with niches
    const completeKOL = await pool.query(`
      SELECT 
        k.*,
        ARRAY_AGG(n.name) as niches
      FROM kols k
      LEFT JOIN kol_niches kn ON k.id = kn.kol_id
      LEFT JOIN niches n ON kn.niche_id = n.id
      WHERE k.id = $1
      GROUP BY k.id
    `, [id]);
    
    res.json(completeKOL.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating KOL:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete KOL (soft delete)
app.delete('/api/kols/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE kols SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KOL not found' });
    }
    
    res.json({ message: 'KOL deleted successfully' });
  } catch (error) {
    console.error('Error deleting KOL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all niches
app.get('/api/niches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM niches ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching niches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Query the database for the user
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE email = $1 AND password_hash = $2',
      [email, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // In production, you should generate a JWT token here
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create initial user (for setup purposes)
app.post('/api/auth/setup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Create new user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, password, name, 'admin']
    );
    
    const user = result.rows[0];
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Setup initial user
async function setupInitialUser() {
  try {
    // Check if any users exist
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    if (userCount === 0) {
      // Create the first user
      await pool.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        ['firaz@alist.com', '123456', 'Firaz', 'admin']
      );
      console.log('Initial user created: firaz@alist.com / 123456');
    } else {
      console.log('Users already exist, skipping initial user setup');
    }
  } catch (error) {
    console.error('Error setting up initial user:', error);
  }
}

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await setupInitialUser();
    await migrateSampleData();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
