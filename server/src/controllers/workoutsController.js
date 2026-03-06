const db = require('../db');

// ─── Workouts ────────────────────────────────────────────────────────────────

exports.list = (req, res) => {
  const workouts = db.prepare(
    `SELECT w.id, w.name, w.workout_date, w.notes, w.created_at, w.updated_at,
            COUNT(DISTINCT we.id) as exercise_count
     FROM workouts w
     LEFT JOIN workout_exercises we ON we.workout_id = w.id
     WHERE w.user_id = ?
     GROUP BY w.id
     ORDER BY w.workout_date DESC, w.created_at DESC`
  ).all(req.userId);
  res.json(workouts);
};

exports.create = (req, res) => {
  const { name, workout_date, notes } = req.body;
  if (!name || !workout_date) {
    return res.status(400).json({ error: 'name and workout_date required' });
  }
  const result = db.prepare(
    `INSERT INTO workouts (user_id, name, workout_date, notes) VALUES (?, ?, ?, ?)`
  ).run(req.userId, name, workout_date, notes || null);

  const workout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(workout);
};

exports.get = (req, res) => {
  const { id } = req.params;
  const workout = db.prepare(
    `SELECT id, name, workout_date, notes, created_at, updated_at FROM workouts WHERE id = ? AND user_id = ?`
  ).get(id, req.userId);
  if (!workout) return res.status(404).json({ error: 'Workout not found' });

  const rows = db.prepare(
    `SELECT we.id as we_id, we.sort_order, we.default_reps, we.default_weight, we.notes as we_notes,
            e.id as exercise_id, e.name as exercise_name,
            s.id as set_id, s.set_number, s.reps, s.weight
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     LEFT JOIN sets s ON s.workout_exercise_id = we.id
     WHERE we.workout_id = ?
     ORDER BY we.sort_order, we.id, s.set_number`
  ).all(id);

  const exercisesMap = new Map();
  for (const row of rows) {
    if (!exercisesMap.has(row.we_id)) {
      exercisesMap.set(row.we_id, {
        id: row.we_id,
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        sort_order: row.sort_order,
        default_reps: row.default_reps,
        default_weight: row.default_weight,
        notes: row.we_notes,
        sets: []
      });
    }
    if (row.set_id) {
      exercisesMap.get(row.we_id).sets.push({
        id: row.set_id,
        set_number: row.set_number,
        reps: row.reps,
        weight: row.weight
      });
    }
  }

  res.json({ ...workout, exercises: [...exercisesMap.values()] });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const workout = db.prepare('SELECT * FROM workouts WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!workout) return res.status(404).json({ error: 'Workout not found' });

  const name = req.body.name ?? workout.name;
  const workout_date = req.body.workout_date ?? workout.workout_date;
  const notes = 'notes' in req.body ? req.body.notes : workout.notes;

  db.prepare(
    `UPDATE workouts SET name = ?, workout_date = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(name, workout_date, notes, id);

  res.json(db.prepare('SELECT * FROM workouts WHERE id = ?').get(id));
};

exports.remove = (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?').run(id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Workout not found' });
  res.json({ ok: true });
};

// ─── Workout Exercises ───────────────────────────────────────────────────────

function requireWorkout(workoutId, userId) {
  const w = db.prepare('SELECT id FROM workouts WHERE id = ? AND user_id = ?').get(workoutId, userId);
  if (!w) {
    const err = new Error('Workout not found'); err.status = 404; throw err;
  }
}

exports.addExercise = (req, res) => {
  const { id: workoutId } = req.params;
  requireWorkout(workoutId, req.userId);

  const { exercise_id, sort_order = 0, default_reps, default_weight, notes } = req.body;
  if (!exercise_id) return res.status(400).json({ error: 'exercise_id required' });

  const ex = db.prepare('SELECT id FROM exercises WHERE id = ?').get(exercise_id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });

  const result = db.prepare(
    `INSERT INTO workout_exercises (workout_id, exercise_id, sort_order, default_reps, default_weight, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(workoutId, exercise_id, sort_order, default_reps ?? null, default_weight ?? null, notes ?? null);

  const we = db.prepare('SELECT * FROM workout_exercises WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...we, sets: [] });
};

exports.updateExercise = (req, res) => {
  const { id: workoutId, weId } = req.params;
  requireWorkout(workoutId, req.userId);

  const we = db.prepare('SELECT * FROM workout_exercises WHERE id = ? AND workout_id = ?').get(weId, workoutId);
  if (!we) return res.status(404).json({ error: 'Workout exercise not found' });

  const sort_order = req.body.sort_order ?? we.sort_order;
  const default_reps = 'default_reps' in req.body ? req.body.default_reps : we.default_reps;
  const default_weight = 'default_weight' in req.body ? req.body.default_weight : we.default_weight;
  const notes = 'notes' in req.body ? req.body.notes : we.notes;

  db.prepare(
    `UPDATE workout_exercises SET sort_order = ?, default_reps = ?, default_weight = ?, notes = ? WHERE id = ?`
  ).run(sort_order, default_reps, default_weight, notes, weId);

  res.json(db.prepare('SELECT * FROM workout_exercises WHERE id = ?').get(weId));
};

exports.removeExercise = (req, res) => {
  const { id: workoutId, weId } = req.params;
  requireWorkout(workoutId, req.userId);

  const result = db.prepare('DELETE FROM workout_exercises WHERE id = ? AND workout_id = ?').run(weId, workoutId);
  if (result.changes === 0) return res.status(404).json({ error: 'Workout exercise not found' });
  res.json({ ok: true });
};

// ─── Sets ────────────────────────────────────────────────────────────────────

function requireWorkoutExercise(workoutId, weId, userId) {
  requireWorkout(workoutId, userId);
  const we = db.prepare('SELECT id FROM workout_exercises WHERE id = ? AND workout_id = ?').get(weId, workoutId);
  if (!we) {
    const err = new Error('Workout exercise not found'); err.status = 404; throw err;
  }
}

exports.addSet = (req, res) => {
  const { id: workoutId, weId } = req.params;
  requireWorkoutExercise(workoutId, weId, req.userId);

  const { reps, weight } = req.body;
  if (reps === undefined || reps === null) return res.status(400).json({ error: 'reps required' });

  const maxSet = db.prepare('SELECT MAX(set_number) as mx FROM sets WHERE workout_exercise_id = ?').get(weId);
  const set_number = (maxSet.mx || 0) + 1;

  const result = db.prepare(
    `INSERT INTO sets (workout_exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)`
  ).run(weId, set_number, reps, weight ?? null);

  res.status(201).json(db.prepare('SELECT * FROM sets WHERE id = ?').get(result.lastInsertRowid));
};

exports.updateSet = (req, res) => {
  const { id: workoutId, weId, setId } = req.params;
  requireWorkoutExercise(workoutId, weId, req.userId);

  const set = db.prepare('SELECT * FROM sets WHERE id = ? AND workout_exercise_id = ?').get(setId, weId);
  if (!set) return res.status(404).json({ error: 'Set not found' });

  const reps = req.body.reps ?? set.reps;
  const weight = 'weight' in req.body ? req.body.weight : set.weight;

  db.prepare('UPDATE sets SET reps = ?, weight = ? WHERE id = ?').run(reps, weight, setId);
  res.json(db.prepare('SELECT * FROM sets WHERE id = ?').get(setId));
};

exports.deleteSet = (req, res) => {
  const { id: workoutId, weId, setId } = req.params;
  requireWorkoutExercise(workoutId, weId, req.userId);

  const result = db.prepare('DELETE FROM sets WHERE id = ? AND workout_exercise_id = ?').run(setId, weId);
  if (result.changes === 0) return res.status(404).json({ error: 'Set not found' });
  res.json({ ok: true });
};
