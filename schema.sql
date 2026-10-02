-- Money Tracker Database Schema
-- Run this SQL to set up your database
 
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '💰',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
 
-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount DECIMAL(10, 2) NOT NULL,
  category_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
 
-- Create budgets table (optional spending limits per category per month)
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL UNIQUE,
  limit_amount DECIMAL(10, 2) NOT NULL,
  month TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
 
-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
 
-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, color, icon) VALUES
  (1, 'Food', '#FF6B6B', '🍔'),
  (2, 'Transport', '#4ECDC4', '🚗'),
  (3, 'Entertainment', '#95E1D3', '🎬'),
  (4, 'Shopping', '#F38181', '🛍️'),
  (5, 'Bills', '#AA96DA', '📄'),
  (6, 'Health', '#FCBAD3', '🏥'),
  (7, 'Other', '#A8DADC', '📌');
