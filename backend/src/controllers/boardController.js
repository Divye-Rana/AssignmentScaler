const db = require('../config/db');

exports.getAllBoards = async (req, res, next) => {
  try {
    // For this example, we assume dummy user 1
    const { rows } = await db.query('SELECT * FROM boards WHERE user_id = $1 ORDER BY created_at DESC', [1]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getBoardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get board
    const boardResult = await db.query('SELECT * FROM boards WHERE id = $1', [id]);
    if (boardResult.rows.length === 0) return res.status(404).json({ error: 'Board not found' });
    const board = boardResult.rows[0];

    // Get lists
    const listsResult = await db.query('SELECT * FROM lists WHERE board_id = $1 ORDER BY position ASC', [id]);
    const lists = listsResult.rows;

    // Get cards with members and labels
    const cardsResult = await db.query(`
      SELECT c.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'avatar_url', u.avatar_url))
           FROM card_members cm
           JOIN users u ON cm.user_id = u.id
           WHERE cm.card_id = c.id), '[]'::json
        ) AS members,
        COALESCE(
          (SELECT json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color))
           FROM card_labels cl
           JOIN labels l ON cl.label_id = l.id
           WHERE cl.card_id = c.id), '[]'::json
        ) AS labels,
        COALESCE(
          (SELECT json_agg(
             json_build_object(
               'id', ch.id,
               'title', ch.title,
               'items', COALESCE((
                   SELECT json_agg(json_build_object('id', ci.id, 'title', ci.title, 'is_completed', ci.is_completed))
                   FROM checklist_items ci WHERE ci.checklist_id = ch.id
               ), '[]'::json)
             )
           )
           FROM checklists ch WHERE ch.card_id = c.id), '[]'::json
        ) AS checklists
      FROM cards c
      JOIN lists li ON c.list_id = li.id
      WHERE li.board_id = $1
      ORDER BY c.position ASC
    `, [id]);
    const cards = cardsResult.rows;

    // For labels and members, we can fetch them separately or embed them, 
    // let's fetch all labels for the board
    const labelsResult = await db.query('SELECT * FROM labels WHERE board_id = $1', [id]);
    const labels = labelsResult.rows;

    res.json({ board, lists, cards, labels });
  } catch (err) {
    next(err);
  }
};

exports.createBoard = async (req, res, next) => {
  try {
    const { title } = req.body;
    const { rows } = await db.query(
      'INSERT INTO boards (title, user_id) VALUES ($1, $2) RETURNING *',
      [title, 1] // User 1 as dummy
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};
