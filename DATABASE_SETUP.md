# Money Tracker Database Setup Guide

Two ways to set up your database:

---

## Option 1: SQL File (Manual Setup)

### Prerequisites:
- SQLite3 installed on your computer
- `schema.sql` file from this repo

### Steps:

1. Open terminal/command prompt in the `money-tracker` folder
2. Run the SQL file:
   ```bash
   sqlite3 money_tracker.db < schema.sql
   ```
3. Verify the database was created:
   ```bash
   sqlite3 money_tracker.db ".tables"
   ```
   You should see: `budgets  categories  transactions`

4. View table structure:
   ```bash
   sqlite3 money_tracker.db ".schema"
   ```

Done! Your `money_tracker.db` file is ready.

---

## Option 2: Node.js Auto-Init (Recommended for Electron)

### Prerequisites:
- Node.js installed
- `better-sqlite3` package installed

### Steps:

1. Install `better-sqlite3`:
   ```bash
   npm install better-sqlite3
   ```

2. In your Electron main process, call this at startup:
   ```javascript
   const { initDatabase, dbPath } = require('./initDb.js');
   
   // In your app.on('ready') or createWindow function:
   const db = initDatabase();
   console.log('Database ready at:', dbPath);
   ```

The database will auto-create when the app starts, with all tables and default categories ready.

---

## Database Schema Overview

### `categories` table (7 default categories included)

| id | name          | color   | icon |
|----|---------------|---------|------|
| 1  | Food          | #FF6B6B | 🍔   |
| 2  | Transport     | #4ECDC4 | 🚗   |
| 3  | Entertainment | #95E1D3 | 🎬   |
| 4  | Shopping      | #F38181 | 🛍️   |
| 5  | Bills         | #AA96DA | 📄   |
| 6  | Health        | #FCBAD3 | 🏥   |
| 7  | Other         | #A8DADC | 📌   |

### `transactions` table (your expense logs)

| id | amount | category_id | item_name | date       | notes    |
|----|--------|-------------|-----------|------------|----------|
| 1  | 50.00  | 1           | Coffee    | 2026-10-03 | Starbucks|
| 2  | 120.00 | 2           | Gas       | 2026-10-03 | Shell    |

### `budgets` table (optional spending limits)

| id | category_id | limit_amount | month   |
|----|-------------|--------------|---------|
| 1  | 1           | 500.00       | 2026-10 |
| 2  | 2           | 300.00       | 2026-10 |

---

## Quick Test After Setup

Open SQLite and run:

```sql
-- View all categories
SELECT * FROM categories;

-- Add a test transaction
INSERT INTO transactions (amount, category_id, item_name, date, notes)
VALUES (50.00, 1, 'Test Coffee', datetime('now'), 'Testing the app');

-- View all transactions
SELECT t.id, t.amount, c.name, t.item_name, t.date 
FROM transactions t 
JOIN categories c ON t.category_id = c.id;

-- Get total spending by category
SELECT c.name, SUM(t.amount) as total
FROM transactions t
JOIN categories c ON t.category_id = c.id
GROUP BY c.id;
```
