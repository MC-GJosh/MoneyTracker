// Initialize SQLite database for money tracker
// Run this in your Electron main process on app startup

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file location (in user's data directory)
const dbPath = path.join(
  process.env.APPDATA || 
  (process.platform === 'darwin' 
    ? path.join(process.env.HOME, 'Library/Preferences')
    : path.join(process.env.HOME, '.config')),
  'money-tracker',
  'money_tracker.db'
);

// Create directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
function initDatabase() {
  try {
    const db = new Database(dbPath);
    
    console.log('Database connected:', dbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT '💰',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
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
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL UNIQUE,
        limit_amount DECIMAL(10, 2) NOT NULL,
        month TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
    `);

    const defaultCategories = [
      { name: 'Food', color: '#FF6B6B', icon: '🍔' },
      { name: 'Transport', color: '#4ECDC4', icon: '🚗' },
      { name: 'Entertainment', color: '#95E1D3', icon: '🎬' },
      { name: 'Shopping', color: '#F38181', icon: '🛍️' },
      { name: 'Bills', color: '#AA96DA', icon: '📄' },
      { name: 'Health', color: '#FCBAD3', icon: '🏥' },
      { name: 'Other', color: '#A8DADC', icon: '📌' },
    ];

    const insertCategory = db.prepare(
      'INSERT OR IGNORE INTO categories (name, color, icon) VALUES (?, ?, ?)'
    );

    for (const cat of defaultCategories) {
      insertCategory.run(cat.name, cat.color, cat.icon);
    }

    console.log('Database initialized with default categories');
    return db;

  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

module.exports = { initDatabase, dbPath };

class DatabaseHelper {
  constructor(db) {
    this.db = db;
  }

  addTransaction(amount, categoryId, itemName, notes = '') {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO transactions (amount, category_id, item_name, date, notes)
        VALUES (?, ?, ?, datetime('now'), ?)
      `);
      const result = stmt.run(amount, categoryId, itemName, notes);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getAllTransactions() {
    try {
      const stmt = this.db.prepare(`
        SELECT t.*, c.name as category_name, c.icon, c.color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  getTransactionsByMonth(year, month) {
    try {
      const stmt = this.db.prepare(`
        SELECT t.*, c.name as category_name, c.icon, c.color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE strftime('%Y-%m', t.date) = ?
        ORDER BY t.date DESC
      `);
      return stmt.all(`${year}-${String(month).padStart(2, '0')}`);
    } catch (error) {
      console.error('Error fetching monthly transactions:', error);
      return [];
    }
  }

  getTransactionsByCategory(categoryId) {
    try {
      const stmt = this.db.prepare(`
        SELECT t.*, c.name as category_name
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.category_id = ?
        ORDER BY t.date DESC
      `);
      return stmt.all(categoryId);
    } catch (error) {
      console.error('Error fetching category transactions:', error);
      return [];
    }
  }

  deleteTransaction(transactionId) {
    try {
      const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
      stmt.run(transactionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateTransaction(transactionId, amount, categoryId, itemName, notes = '') {
    try {
      const stmt = this.db.prepare(`
        UPDATE transactions 
        SET amount = ?, category_id = ?, item_name = ?, notes = ?
        WHERE id = ?
      `);
      stmt.run(amount, categoryId, itemName, notes, transactionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getAllCategories() {
    try {
      const stmt = this.db.prepare('SELECT * FROM categories ORDER BY name');
      return stmt.all();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  addCategory(name, color = '#3B82F6', icon = '💰') {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO categories (name, color, icon)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(name, color, icon);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  setBudget(categoryId, limitAmount, year, month) {
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO budgets (category_id, limit_amount, month)
        VALUES (?, ?, ?)
      `);
      stmt.run(categoryId, limitAmount, monthStr);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getBudget(categoryId, year, month) {
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const stmt = this.db.prepare(`
        SELECT * FROM budgets WHERE category_id = ? AND month = ?
      `);
      return stmt.get(categoryId, monthStr);
    } catch (error) {
      console.error('Error fetching budget:', error);
      return null;
    }
  }

  getSpendingByCategory(year, month) {
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const stmt = this.db.prepare(`
        SELECT 
          c.id,
          c.name as category_name,
          c.icon,
          c.color,
          SUM(t.amount) as total_spent
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id 
          AND strftime('%Y-%m', t.date) = ?
        GROUP BY c.id
        ORDER BY total_spent DESC
      `);
      return stmt.all(monthStr);
    } catch (error) {
      console.error('Error fetching spending summary:', error);
      return [];
    }
  }

  getTotalBalance() {
    try {
      const stmt = this.db.prepare('SELECT SUM(amount) as total FROM transactions');
      const result = stmt.get();
      return result?.total || 0;
    } catch (error) {
      console.error('Error calculating balance:', error);
      return 0;
    }
  }

  getCurrentMonthTotal() {
    try {
      const stmt = this.db.prepare(`
        SELECT SUM(amount) as total
        FROM transactions
        WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      `);
      const result = stmt.get();
      return result?.total || 0;
    } catch (error) {
      console.error('Error fetching current month total:', error);
      return 0;
    }
  }
}

module.exports = DatabaseHelper;
