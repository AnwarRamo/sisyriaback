import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Indexes
appointmentSchema.index({ userId: 1, start: 1 }); // Fetch user appointments
appointmentSchema.index({ start: 1, end: 1 }); // Time range queries

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;