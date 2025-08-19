import Relationship from '../models/Relationship.model.js';

export const getMyRelationship = async (req, res) => {
  const rel = await Relationship.findOne({ userId: req.user.userId }).lean();
  res.json(rel || null);
};

export const createOrUpdateRelationship = async (req, res) => {
  const { partnerName, partnerEmail, loveLanguages } = req.body;
  const rel = await Relationship.findOneAndUpdate(
    { userId: req.user.userId },
    { $set: { partnerName, partnerEmail, loveLanguages } },
    { new: true, upsert: true }
  );
  res.status(201).json(rel);
};

export const addMilestone = async (req, res) => {
  const { title, date, description } = req.body;
  const rel = await Relationship.findOneAndUpdate(
    { userId: req.user.userId },
    { $push: { milestones: { title, date, description } } },
    { new: true, upsert: true }
  );
  res.status(201).json(rel);
};

export const addJournalEntry = async (req, res) => {
  const { title, content, date } = req.body;
  const rel = await Relationship.findOneAndUpdate(
    { userId: req.user.userId },
    { $push: { journal: { title, content, date } } },
    { new: true, upsert: true }
  );
  res.status(201).json(rel);
};

export const addGiftIdea = async (req, res) => {
  const { title, notes, occasion, link } = req.body;
  const rel = await Relationship.findOneAndUpdate(
    { userId: req.user.userId },
    { $push: { gifts: { title, notes, occasion, link } } },
    { new: true, upsert: true }
  );
  res.status(201).json(rel);
};

export const addGoal = async (req, res) => {
  const { title, description, targetDate } = req.body;
  const rel = await Relationship.findOneAndUpdate(
    { userId: req.user.userId },
    { $push: { goals: { title, description, targetDate } } },
    { new: true, upsert: true }
  );
  res.status(201).json(rel);
};

export const updateLoveLanguages = async (req, res) => {
  const { user, partner } = req.body;
  const rel = await Relationship.findOneAndUpdate(
    { userId: req.user.userId },
    { $set: { loveLanguages: { user, partner } } },
    { new: true, upsert: true }
  );
  res.status(200).json(rel);
};



