const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/tests/unit/**/*.test.ts", "**/tests/unit/**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/integration/"],
};

module.exports = createJestConfig(customJestConfig);