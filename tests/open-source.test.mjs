import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rootFile = (path) => new URL(`../${path}`, import.meta.url);

test("public package metadata identifies the repository, license, and author", async () => {
  const packageJson = JSON.parse(await readFile(rootFile("package.json"), "utf8"));

  assert.equal(packageJson.license, "MIT");
  assert.deepEqual(packageJson.author, {
    name: "Ghassan Al Hamoud",
    url: "https://ghassan-alhamoud.com",
  });
  assert.equal(packageJson.repository.url, "https://github.com/ghassan-ai-projects/scaleshop-scalability-lab.git");
  assert.ok(packageJson.scripts.check);
});

test("footer exposes the public author and project links", async () => {
  const footer = await readFile(rootFile("components/SiteFooter.tsx"), "utf8");

  assert.match(footer, /Ghassan Al Hamoud/);
  assert.match(footer, /https:\/\/ghassan-alhamoud\.com/);
  assert.match(footer, /https:\/\/github\.com\/ghassan-ai-projects\/scaleshop-scalability-lab/);
  assert.match(footer, /<footer className="site-footer">/);
  assert.match(footer, /aria-label="Project links"/);
});

test("community health files are present and point contributors to the quality gate", async () => {
  const files = ["CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "SUPPORT.md", ".github/PULL_REQUEST_TEMPLATE.md"];
  const contents = await Promise.all(files.map((path) => readFile(rootFile(path), "utf8")));

  assert.match(contents[0], /npm run check/);
  assert.match(contents[2], /security\/advisories\/new/);
  assert.ok(contents.every((content) => content.trim().length > 100));
});
