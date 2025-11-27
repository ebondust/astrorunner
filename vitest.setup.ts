import "@testing-library/jest-dom";

// Mock import.meta.env for tests
Object.defineProperty(import.meta, "env", {
  value: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-key",
    OPENROUTER_API_KEY: "test-openrouter-key",
  },
});
