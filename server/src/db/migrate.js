require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./index');

const migrationsDir = path.join(__dirname, 'migrations');

function runMigrations() {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    console.log(`[migrate] Applied: ${file}`);
  }
}

function seedAdmin() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (count.cnt > 0) return;

  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    `INSERT INTO users (username, password_hash, role, must_change_password)
     VALUES (?, ?, 'admin', 1)`
  ).run('admin', hash);

  console.log('[seed] Default admin created: admin / admin123 (must change password on first login)');
}

runMigrations();
seedAdmin();
console.log('[migrate] Done.');
