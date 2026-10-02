import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['dotenv/config'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
