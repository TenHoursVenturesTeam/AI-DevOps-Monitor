const { UserStore } = require('./store');

// File-based User model (no MongoDB required)
// API mimics Mongoose methods so routes don't need major changes
const User = {
  findOne(query) {
    const user = UserStore.findOne(query);
    // Support .select('+password') chain
    return {
      ...user,
      select(fields) {
        if (fields === '+password') return user;
        if (fields === '-password' && user) {
          const { password, ...rest } = user;
          return rest;
        }
        return user;
      }
    };
  },

  findById(id) {
    return UserStore.findById(id);
  },

  find() {
    return {
      select(fields) {
        return UserStore.find(); // Already excludes password
      }
    };
  },

  async save(userData) {
    return UserStore.create(userData);
  }
};

module.exports = User;
