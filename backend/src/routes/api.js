const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const listController = require('../controllers/listController');
const cardController = require('../controllers/cardController');
const userController = require('../controllers/userController');

// --- Users ---
router.get('/users', userController.getAllUsers);

// --- Boards ---
router.get('/boards', boardController.getAllBoards);
router.get('/boards/:id', boardController.getBoardById);
router.post('/boards', boardController.createBoard);

// --- Lists ---
router.post('/lists', listController.createList);
router.put('/lists/:id', listController.updateList);
router.delete('/lists/:id', listController.deleteList);
router.patch('/lists/:id/reorder', listController.reorderList);

// --- Cards ---
router.post('/cards', cardController.createCard);
router.put('/cards/:id', cardController.updateCard);
router.delete('/cards/:id', cardController.deleteCard);
router.patch('/cards/:id/reorder', cardController.reorderCard);

// Card Extras (Members, Checklists)
router.post('/cards/:id/members', cardController.addMember);
router.delete('/cards/:id/members/:userId', cardController.removeMember);

router.post('/cards/:id/checklists', cardController.addChecklist);
router.post('/checklists/:id/items', cardController.addChecklistItem);
router.put('/checklists/items/:itemId', cardController.updateChecklistItem);

module.exports = router;
