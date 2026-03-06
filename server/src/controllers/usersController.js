const bcrypt = require('bcryptjs');
const db = require('../db');

exports.list = (req, res) => {
  const users = db.prepare('SELECT id, username, role, must_change_password, created_at FROM users ORDER BY username').all();
  res.json(users.map(u => ({ ...u, must_change_password: u.must_change_password === 1 })));
};

exports.create = (req, res) => {
  const { username, password, role = 'user' } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or user' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      `INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, 1)`
    ).run(username, hash, role);
    const user = db.prepare('SELECT id, username, role, must_change_password, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...user, must_change_password: user.must_change_password === 1 });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw err;
  }
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newUsername = username ?? user.username;
  const newRole = role ?? user.role;

  if (!['admin', 'user'].includes(newRole)) {
    return res.status(400).json({ error: 'role must be admin or user' });
  }

  // Prevent removing last admin
  if (newRole !== 'admin' && user.role === 'admin') {
    const adminCount = db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'`).get();
    if (adminCount.cnt <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin' });
    }
  }

  try {
    db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(newUsername, newRole, id);
    const updated = db.prepare('SELECT id, username, role, must_change_password, created_at FROM users WHERE id = ?').get(id);
    res.json({ ...updated, must_change_password: updated.must_change_password === 1 });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw err;
  }
};

exports.remove = (req, res) => {
  const { id } = req.params;
  const targetId = parseInt(id, 10);

  if (targetId === req.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'admin') {
    const adminCount = db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'`).get();
    if (adminCount.cnt <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  res.json({ ok: true });
};

exports.resetPassword = (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(hash, id);
  res.json({ ok: true });
};
