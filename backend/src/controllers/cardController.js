const db = require('../config/db');

exports.createCard = async (req, res, next) => {
  try {
    const { list_id, title, description } = req.body;
    
    // Get max position to append
    const posResult = await db.query('SELECT MAX(position) as max_pos FROM cards WHERE list_id = $1', [list_id]);
    const nextPos = (posResult.rows[0].max_pos || 0) + 1024;

    const { rows } = await db.query(
      'INSERT INTO cards (list_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [list_id, title, description || '', nextPos]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, due_date } = req.body;
    
    const { rows } = await db.query(
      'UPDATE cards SET title = COALESCE($1, title), description = COALESCE($2, description), due_date = COALESCE($3, due_date), updated_at = NOW() WHERE id = $4 RETURNING *',
      [title, description, due_date, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM cards WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Moving a card to another list or reordering within a list
exports.reorderCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { list_id, position } = req.body;
    
    const { rows } = await db.query(
      'UPDATE cards SET list_id = $1, position = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [list_id, position, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// --- Members ---
exports.addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    await db.query(
      'INSERT INTO card_members (card_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, user_id]
    );
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    next(err);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    await db.query(
      'DELETE FROM card_members WHERE card_id = $1 AND user_id = $2',
      [id, userId]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// --- Checklists ---
exports.addChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const { rows } = await db.query(
      'INSERT INTO checklists (card_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [id, title, 1024] // Default position for simplicity
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.addChecklistItem = async (req, res, next) => {
  try {
    const { id } = req.params; // checklist id
    const { title } = req.body;
    const { rows } = await db.query(
      'INSERT INTO checklist_items (checklist_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [id, title, 1024]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateChecklistItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { is_completed, title } = req.body;
    
    // Dynamically build query depending on what's provided
    let query = 'UPDATE checklist_items SET ';
    const params = [];
    let paramCount = 1;

    if (is_completed !== undefined) {
      query += `is_completed = $${paramCount++} `;
      params.push(is_completed);
    }
    if (title !== undefined) {
      if (params.length > 0) query += ', ';
      query += `title = $${paramCount++} `;
      params.push(title);
    }

    query += `WHERE id = $${paramCount} RETURNING *`;
    params.push(itemId);

    if (params.length === 1) return res.status(400).send('No fields to update');

    const { rows } = await db.query(query, params);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
