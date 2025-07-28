import { Client, cacheExchange, fetchExchange } from "@urql/svelte";

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const client = new Client({
  url: `${API_URL}/graphql`,
  exchanges: [cacheExchange, fetchExchange],
});
