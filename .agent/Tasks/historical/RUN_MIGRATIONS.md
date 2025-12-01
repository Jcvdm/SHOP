# 🚀 Run Database Migrations - Quick Start

## Step 1: Open Supabase Dashboard

Click this link: **https://cfblmkzleqtvtfxujikf.supabase.co**

## Step 2: Navigate to SQL Editor

1. In the left sidebar, click on **SQL Editor** (icon looks like `</>`)
2. Click the **New Query** button (top right)

## Step 3: Run the Schema Migration

1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C)
3. Paste into the SQL Editor in Supabase
4. Click **Run** button (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

This creates:
- ✅ `clients` table
- ✅ `requests` table
- ✅ `request_tasks` table
- ✅ `engineers` table
- ✅ All indexes and triggers
- ✅ RLS policies

## Step 4: (Optional) Add Sample Data

1. Click **New Query** again
2. Open the file: `supabase/seed.sql`
3. Copy **ALL** the contents
4. Paste into the SQL Editor
5. Click **Run**

This adds:
- 5 sample clients (3 insurance, 2 private)
- 3 sample engineers
- 3 sample requests
- 4 sample tasks

## Step 5: Verify Tables Were Created

1. In the left sidebar, click on **Table Editor**
2. You should see 4 tables:
   - clients
   - engineers
   - requests
   - request_tasks
3. Click on each table to see the structure and data (if you ran seed.sql)

## ✅ Done!

Your database is now set up and ready to use!

Next, we'll build the UI pages to interact with this data.

---

## Troubleshooting

**If you get an error about uuid-ossp:**
- The extension should be automatically available in Supabase
- If not, run this first: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

**If you get permission errors:**
- Make sure you're logged into the correct Supabase project
- Check that you're using the project URL: https://cfblmkzleqtvtfxujikf.supabase.co

**If tables already exist:**
- You can drop them first with: `DROP TABLE IF EXISTS request_tasks, requests, clients, engineers CASCADE;`
- Then run the migration again

