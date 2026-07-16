const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userEmail: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, default: 'N/A' },
  ip: { type: String, required: true }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);