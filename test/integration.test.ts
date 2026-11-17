// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me") || baseUrl.includes("localhost");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Ligation Insert Ratio Calculator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("sticky_3to1_batch");
      expect(names).toContain("insert_limited_mode");
    },
    30_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs sticky_3to1_batch example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("sticky_3to1_batch");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.rows?.length).toBe(1);
      expect(result.result?.rows?.[0].insert_mass_ng).toBe(45);
      expect(result.result?.master_mix?.reaction_count).toBe(1);
      expect(result.result?.master_mix?.ul_buffer).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs insert_limited_mode example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("insert_limited_mode");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.rows?.length).toBe(1);
      expect(result.result?.rows?.[0].valid).toBe(true);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches previous run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("sticky_3to1_batch");
      const runRes = await client.run(input);

      const fetched = await client.getRun(runRes.run_id);
      expect(fetched.run_id).toBe(runRes.run_id);
      expect(fetched.status).toBe("completed");
      expect(fetched.result?.rows?.length).toBe(1);
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Ligation Insert Ratio Calculator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("sticky_3to1_batch");
      expect(names).toContain("insert_limited_mode");
    },
    30_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs sticky_3to1_batch example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("sticky_3to1_batch");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.rows?.length).toBe(1);
      expect(result.result?.rows?.[0].insert_mass_ng).toBe(45);
      expect(result.result?.master_mix?.reaction_count).toBe(1);
      expect(result.result?.master_mix?.ul_buffer).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs insert_limited_mode example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("insert_limited_mode");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.rows?.length).toBe(1);
      expect(result.result?.rows?.[0].valid).toBe(true);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches previous run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("sticky_3to1_batch");
      const runRes = await client.run(input);

      const fetched = await client.getRun(runRes.run_id);
      expect(fetched.run_id).toBe(runRes.run_id);
      expect(fetched.status).toBe("completed");
      expect(fetched.result?.rows?.length).toBe(1);
    },
    60_000,
  );
});
