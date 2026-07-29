const { AuditStore } = require('./store');

// File-based AuditLog (no MongoDB required)
// Constructor pattern mimics Mongoose: new AuditLog({...}).save()
class AuditLog {
  constructor(data) {
    this.data = data;
  }

  async save() {
    return AuditStore.create(this.data);
  }

  static find() {
    return AuditStore.find();
  }
}

module.exports = AuditLog;
