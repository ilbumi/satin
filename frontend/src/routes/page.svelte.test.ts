import { page } from "@vitest/browser/context";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Page from "./+page.svelte";

// Mock $app/stores for Navigation component
vi.mock("$app/stores", () => ({
  page: {
    subscribe: vi.fn((callback) => {
      callback({
        url: {
          pathname: "/",
        },
      });
      return () => {}; // unsubscribe function
    }),
  },
}));

describe("/+page.svelte", () => {
  it("should render main page components", async () => {
    render(Page);

    // Check for demo button which should be present
    const demoButton = page.getByRole("button", { name: /load demo image/i });
    await expect.element(demoButton).toBeInTheDocument();

    // Check for brand link from navigation
    const brandLink = page.getByRole("link", { name: /satin/i });
    await expect.element(brandLink).toBeInTheDocument();
  });
});
