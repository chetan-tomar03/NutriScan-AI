export default {
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    testTimeout: 20000,
    hookTimeout: 120000,
  },
};