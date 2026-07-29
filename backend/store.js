const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============ USER STORE ============

const UserStore = {
  findOne(query) {
    const users = readJSON(USERS_FILE);
    if (query.email) {
      return users.find(u => u.email === query.email) || null;
    }
    if (query._id) {
      return users.find(u => u._id === query._id) || null;
    }
    return null;
  },

  findById(id) {
    const users = readJSON(USERS_FILE);
    return users.find(u => u._id === id) || null;
  },

  find() {
    const users = readJSON(USERS_FILE);
    // Return without passwords
    return users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
  },

  create(userData) {
    const users = readJSON(USERS_FILE);
    const newUser = {
      _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  }
};

// ============ AUDIT LOG STORE ============

const AuditStore = {
  create(logData) {
    const logs = readJSON(AUDIT_FILE);
    const newLog = {
      _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      ...logData
    };
    logs.unshift(newLog);
    // Keep only last 500 audit entries
    if (logs.length > 500) logs.length = 500;
    writeJSON(AUDIT_FILE, logs);
    return newLog;
  },

  find() {
    return readJSON(AUDIT_FILE);
  }
};

module.exports = { UserStore, AuditStore };
