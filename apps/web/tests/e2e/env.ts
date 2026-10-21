export const E2E = {
  baseURL: "http://localhost:3100",
  aiURL: "http://localhost:8101",
  env: {
    DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://digitsnepal:digitsnepal_dev@localhost:5433/digitsnepal_e2e",
    BETTER_AUTH_URL: "http://localhost:3100",
    BETTER_AUTH_SECRET: "e2e-secret-0123456789-0123456789-abcdef",
    AI_SERVICE_URL: "http://localhost:8101",
    AI_SERVICE_TOKEN: "e2e-ai-token",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_DIR: "./.storage-e2e",
    AUTH_RATE_LIMIT: "off",
    NEXT_DIST_DIR: ".next-e2e",
    WORKER_POLL_MS: "300",
  },
  password: "e2e-password-123",
  users: {
    educator: { email: "educator@e2e.test", name: "E2E Educator" },
    educator2: { email: "educator2@e2e.test", name: "Second Educator" },
    learner: { email: "learner@e2e.test", name: "E2E Learner" },
    admin: { email: "admin@e2e.test", name: "E2E Admin" },
  },
};
