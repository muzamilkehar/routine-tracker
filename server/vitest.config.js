import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Fake-but-valid settings so tests never touch your real .env or database
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      CLIENT_URL: 'http://localhost:5173',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/routine_tracker_test',
      JWT_ACCESS_SECRET: 'test-secret-test-secret-test-secret-123456',
    },
    // Starting the in-memory database can be slow on a first run
    hookTimeout: 300000,
    testTimeout: 30000,
  },
});