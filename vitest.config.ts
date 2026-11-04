import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'rules', include: ['tests/firestore-rules/**/*.test.ts'], environment: 'node', fileParallelism: false, testTimeout: 15000, hookTimeout: 30000 } },
    ],
  },
})
