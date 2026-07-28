"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  collectUpstreamMajorUpgradeEvidence,
  githubRepository,
  packageRepositoryUrl,
} = require("./collect-upstream-major-upgrade-evidence");

test("normalizes npm object and string repository metadata", () => {
  assert.equal(
    packageRepositoryUrl({ repository: { url: "git+https://github.com/example/object.git" } }),
    "git+https://github.com/example/object.git",
  );
  assert.equal(
    packageRepositoryUrl({ repository: "git@github.com:example/string.git" }),
    "git@github.com:example/string.git",
  );
  assert.equal(githubRepository("git@github.com:example/string.git"), "example/string");
});

test("collects a scoped npm package release from string repository metadata", async () => {
  const releaseCalls = [];
  const evidence = await collectUpstreamMajorUpgradeEvidence({
    dependencyNames: "@scope/package",
    packageEcosystem: "npm",
    previousVersion: "1.0.0",
    newVersion: "2.0.0",
    fetchJson: async () => ({ repository: "https://github.com/example/package.git" }),
    getReleaseByTag: async (request) => {
      releaseCalls.push(request);
      if (request.tag === "v2.0.0") {
        return {
          tag_name: "v2.0.0",
          name: "2.0.0",
          published_at: "2026-07-28T00:00:00Z",
          html_url: "https://github.com/example/package/releases/tag/v2.0.0",
          body: "Major public API change.",
        };
      }
      const error = new Error("not found");
      error.status = 404;
      throw error;
    },
  });

  assert.deepEqual(releaseCalls, [
    { owner: "example", repo: "package", tag: "2.0.0" },
    { owner: "example", repo: "package", tag: "v2.0.0" },
  ]);
  assert.equal(evidence.release_sources.length, 1);
  assert.equal(evidence.release_sources[0].release_notes, "Major public API change.");
  assert.deepEqual(evidence.retrieval_notes, []);
});

test("returns a bounded, non-failing evidence record when upstream lookup fails", async () => {
  const evidence = await collectUpstreamMajorUpgradeEvidence({
    dependencyNames: ["example"],
    packageEcosystem: "npm",
    previousVersion: "1.0.0",
    newVersion: "2.0.0",
    fetchJson: async () => {
      throw new Error("registry unavailable");
    },
    getReleaseByTag: async () => {
      throw new Error("should not be called");
    },
  });

  assert.deepEqual(evidence.release_sources, []);
  assert.deepEqual(evidence.retrieval_notes, [
    "Could not collect upstream metadata for example@2.0.0: registry unavailable",
  ]);
});

test("bounds upstream release notes without losing the source record", async () => {
  const evidence = await collectUpstreamMajorUpgradeEvidence({
    dependencyNames: ["actions/checkout"],
    packageEcosystem: "github-actions",
    previousVersion: "4.0.0",
    newVersion: "5.0.0",
    releaseNoteLimit: 12,
    fetchJson: async () => {
      throw new Error("should not be called");
    },
    getReleaseByTag: async () => ({
      tag_name: "v5.0.0",
      html_url: "https://github.com/actions/checkout/releases/tag/v5.0.0",
      body: "A release note that exceeds the configured limit.",
    }),
  });

  assert.equal(evidence.release_sources[0].tag, "v5.0.0");
  assert.equal(
    evidence.release_sources[0].release_notes,
    "A release no\n[truncated to 12 characters]",
  );
});
