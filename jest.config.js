module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
    '\\.[jt]s$': '<rootDir>/jest-transform.js',
  },
};