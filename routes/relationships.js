import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getMyRelationship,
  createOrUpdateRelationship,
  addMilestone,
  addJournalEntry,
  addGiftIdea,
  addGoal,
  updateLoveLanguages,
} from '../controllers/relationships.controller.js';

const router = express.Router();

router.use(verifyToken());

router.get('/me', getMyRelationship);
router.post('/', createOrUpdateRelationship);
router.post('/milestones', addMilestone);
router.post('/journal', addJournalEntry);
router.post('/gifts', addGiftIdea);
router.post('/goals', addGoal);
router.put('/love-languages', updateLoveLanguages);

export default router;



