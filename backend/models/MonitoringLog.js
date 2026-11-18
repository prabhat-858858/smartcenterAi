
import mongoose from "mongoose";

const monitoringSchema = new mongoose.Schema({
  centreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Centre",
    required: true
  },

  classroomId: String,

  peopleCount: {
    type: Number,
    default: 0
  },

  objects: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  complianceScore: Number,

  issues: [String],

  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "MonitoringLog",
  monitoringSchema
);
