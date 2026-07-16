const request = require('supertest');
const app = require('../server'); // Aapke Express app ko import karein
const mongoose = require('mongoose');
const User = require('../User');
// The User model is imported here, but it needs to be re-imported after the test database connection is established
// to ensure it's bound to the correct connection when bufferCommands is false.
// So, we'll move the actual require call inside beforeAll.
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let UserModel; // Declare a variable to hold the User model

describe('Auth API', () => {
  // Test se pehle database connect karein aur saare users delete karein
  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);

      // Clear Mongoose's internal model cache and re-import the User model.
      // This is crucial when `bufferCommands` is `false` to ensure the model
      // is compiled against an active connection, preventing the error.
      mongoose.models = {};
      mongoose.modelSchemas = {};
      UserModel = require('../User'); // Re-import the User model after connection
    } catch (error) {
      console.error("MongoMemoryServer failed to start:", error);
      mongoServer = null; // Ensure mongoServer is null if creation fails
      throw error; // Re-throw to fail beforeAll
    }
  }, 30000); // Timeout badha kar 30 seconds kiya for initial server start

  // Har test ke baad users clear karein
  afterEach(async () => { // Use UserModel instead of User
    await User.deleteMany({});
  }, 10000); // Timeout badha kar 10 seconds kiya for cleanup

  // Saare tests ke baad database disconnect karein
  afterAll(async () => {
    if (mongoose.connection.readyState === 1) { // Only close if connected
      await mongoose.connection.close();
    }
    if (mongoServer) { // Only stop if it was successfully created
      await mongoServer.stop();
    }
  }, 10000); // Timeout badha kar 10 seconds kiya for closing

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'register@example.com',
        password: 'password123',
        role: 'viewer'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
    const user = await UserModel.findOne({ email: 'register@example.com' }); // Use UserModel
    expect(user).not.toBeNull();
    expect(user.name).toBe('Test User');
  });

  it('should not register a user with existing email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'User One', email: 'duplicate@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User Two', email: 'duplicate@example.com', password: 'password456' }); // Same email as above
    expect(res.statusCode).toEqual(400); // Use UserModel
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  it('should login an existing user and return a token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email: 'login@example.com', password: 'loginpassword' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'loginpassword' }); // Use UserModel
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'login@example.com');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
});