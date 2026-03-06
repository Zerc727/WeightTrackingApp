const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/weights.db';
const resolvedPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(__dirname, '../../', dbPath);

const db = new Database(resolvedPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
