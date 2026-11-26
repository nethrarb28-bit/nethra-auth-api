const express = require('express');
const { getAll, getOne, runQuery } = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes in this router require a valid authenticated session/token
router.use(requireAuth);

// GET /api/notes - Fetch only the logged-in user's notes
router.get('/', (req, res, next) => {
  try {
    const notes = getAll(
      'SELECT id, title, content, created_at FROM notes WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    res.status(200).json({
      success: true,
      user: req.user.email,
      count: notes.length,
      data: notes
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/notes - Create a private note for the logged-in user
router.post('/', (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Note title is required (minimum 2 characters).'
      });
    }

    const noteId = runQuery(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title.trim(), typeof content === 'string' ? content.trim() : '']
    );

    const created = getOne(
      'SELECT id, title, content, created_at FROM notes WHERE id = ?',
      [noteId]
    );

    res.status(201).json({
      success: true,
      message: 'Private note created.',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id - Delete a note belonging to the logged-in user
router.delete('/:id', (req, res, next) => {
  try {
    const noteId = Number(req.params.id);
    if (!Number.isInteger(noteId) || noteId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.'
      });
    }

    const note = getOne('SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, req.user.id]);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied.'
      });
    }

    runQuery('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, req.user.id]);
    res.status(200).json({
      success: true,
      message: 'Note deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
