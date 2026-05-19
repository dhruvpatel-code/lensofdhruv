import { test, expect } from "@playwright/test";

test("GET /api/health returns JSON shape", async ({ request }) => {
  const res = await request.get("/api/health");
  // db is expected "down" against placeholder envs but the route should still
  // return a valid response. With real env vars, expect 200 and db: "up".
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(body).toMatchObject({
    ok: expect.any(Boolean),
    env: expect.any(String),
    db: expect.stringMatching(/^(up|down)$/),
    commit: expect.any(String),
    time: expect.any(String),
  });
});

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /lens of dhruv/i })).toBeVisible();
});
