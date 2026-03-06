const db = require('../db');

exports.list = (req, res) => {
  const exercises = db.prepare('SELECT * FROM exercises ORDER BY name COLLATE NOCASE').all();
  res.json(exercises);
};

exports.create = (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const result = db.prepare('INSERT INTO exercises (name) VALUES (?)').run(name.trim());
    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(exercise);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Exercise name already exists' });
    }
    throw err;
  }
};

exports.remove = (req, res) => {
  const { id } = req.params;

  const inUse = db.prepare('SELECT 1 FROM workout_exercises WHERE exercise_id = ? LIMIT 1').get(id);
  if (inUse) {
    return res.status(409).json({ error: 'Exercise is used in existing workouts and cannot be deleted' });
  }

  const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Exercise not found' });
  res.json({ ok: true });
};
