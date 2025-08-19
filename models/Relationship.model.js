import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: String,
  date: Date,
  description: String,
}, { _id: true, timestamps: true });

const journalSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: { type: Date, default: Date.now },
}, { _id: true, timestamps: true });

const giftIdeaSchema = new mongoose.Schema({
  title: String,
  notes: String,
  occasion: String,
  link: String,
  isPurchased: { type: Boolean, default: false },
}, { _id: true, timestamps: true });

const goalSchema = new mongoose.Schema({
  title: String,
  description: String,
  targetDate: Date,
  completed: { type: Boolean, default: false },
}, { _id: true, timestamps: true });

const photoSchema = new mongoose.Schema({
  url: String,
  caption: String,
  date: { type: Date, default: Date.now },
}, { _id: true, timestamps: true });

const relationshipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  partnerName: String,
  partnerEmail: String,
  loveLanguages: {
    user: String,
    partner: String,
  },
  milestones: [milestoneSchema],
  journal: [journalSchema],
  gifts: [giftIdeaSchema],
  goals: [goalSchema],
  photos: [photoSchema],
}, { timestamps: true });

export default mongoose.model('Relationship', relationshipSchema);



