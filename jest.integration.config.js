const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/tests/integration/**/*.test.ts", "**/tests/integration/**/*.test.tsx"],
  setupFilesAfterEnv: [],
};

module.exports = createJestConfig(customJestConfig);