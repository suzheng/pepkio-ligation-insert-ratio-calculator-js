// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { PepkioAPIError } from "../src/types.js";

const mockManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "Ligation Insert Ratio Calculator",
  description: "Batch ligation calculator",
  examples: [
    {
      name: "sticky_3to1_batch",
      input: {
        ligation_type: "sticky_end",
        calc_mode: "fixed_vector_mass",
        vector_size: 5000,
        vector_size_unit: "bp",
        vector_concentration: 50,
        vector_conc_unit: "ng_uL",
        vector_mass: 50,
        vector_mass_unit: "ng",
        reaction_volume_ul: 20,
        ligase_volume_ul: 1,
        buffer_fraction: 0.1,
        overage_mode: "percent_10",
        inserts: [
          {
            id: "ins1",
            name: "Insert-A",
            size: 1500,
            size_unit: "bp",
            concentration: 20,
            conc_unit: "ng_uL",
            molar_ratio: 3,
          },
        ],
      },
      output: {
        rows: [{ insert_mass_ng: 45 }],
      },
    },
  ],
};

const mockRunResponse = {
  run_id: "test-run-ligation-123",
  status: "completed",
  result: {
    ligation_type: "sticky_end",
    calc_mode: "fixed_vector_mass",
    protocol: {
      default_ratio: 3,
      incubation: "16°C overnight or 25°C (RT) 10–15 min",
      heat_inactivation: "65°C for 10 min",
      notes: "Insert:vector molar excess; standard sticky-end cloning.",
    },
    vector_bp: 5000,
    vector_mass_ng: 50,
    reaction_volume_ul: 20,
    rows: [
      {
        id: "ins1",
        name: "Insert-A",
        molar_ratio: 3,
        insert_mass_ng: 45,
        vector_mass_ng: 50,
        ul_insert: 2.25,
        ul_vector: 1,
        ul_buffer: 2,
        ul_ligase: 1,
        ul_water: 13.75,
        total_dna_ng: 95,
        valid: true,
        warnings: [],
      },
    ],
    master_mix: {
      reaction_count: 1,
      overage_multiplier: 1.1,
      ul_buffer: 2.2,
      ul_ligase: 1.1,
      ul_water: 15.13,
      ul_water_total: 15.13,
      uniform_water: true,
      ul_vector: 1.1,
      uniform_vector: true,
      ul_core_mm_pooled: 3.3,
    },
    global_warnings: [],
    has_blocking_errors: false,
  },
  error: null,
  result_url: "https://tools.pepkio.com/api/tools/v1/runs/test-run-ligation-123",
  permalink: "https://tools.pepkio.com/r/test-run-ligation-123",
};

describe("config helpers", () => {
  it("resolves default baseUrl when none provided", () => {
    delete process.env.PEPKIO_API_BASE_URL;
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("resolves custom baseUrl override", () => {
    expect(resolveBaseUrl("https://custom.pepkio.com/")).toBe("https://custom.pepkio.com");
  });

  it("resolves baseUrl from PEPKIO_API_BASE_URL env var", () => {
    process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com/";
    expect(resolveBaseUrl()).toBe("https://env.pepkio.com");
    delete process.env.PEPKIO_API_BASE_URL;
  });

  it("identifies local test URLs", () => {
    expect(isLocalUrl("https://tools.localtest.me")).toBe(true);
    expect(isLocalUrl("http://localhost:8000")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalUrl("https://tools.pepkio.com")).toBe(false);
  });

  it("resolves API key preferring LOCAL_PEPKIO_API_KEY on local hosts", () => {
    process.env.LOCAL_PEPKIO_API_KEY = "local-key";
    process.env.PEPKIO_API_KEY = "prod-key";

    expect(resolveApiKey("https://tools.localtest.me")).toBe("local-key");
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");

    delete process.env.LOCAL_PEPKIO_API_KEY;
    delete process.env.PEPKIO_API_KEY;
  });
});

describe("PepkioClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches manifest and caches it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient();
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/manifest`,
    );

    // Second call should use cache
    const cached = await client.getManifest();
    expect(cached.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Refresh option should bypass cache
    await client.getManifest({ refresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lists examples and retrieves example input", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    });

    const client = new PepkioClient();
    const examples = await client.getExamples();
    expect(examples).toHaveLength(1);
    expect(examples[0].name).toBe("sticky_3to1_batch");

    const input = await client.getExampleInput("sticky_3to1_batch");
    expect(input.ligation_type).toBe("sticky_end");
    expect(input.calc_mode).toBe("fixed_vector_mass");
    expect(input.inserts).toHaveLength(1);

    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("requires API key for run()", async () => {
    const client = new PepkioClient({ apiKey: "" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow(PepkioAPIError);
    await expect(client.run(input)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("API key required"),
    });
  });

  it("executes tool run successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-token" });
    const input = mockManifest.examples[0].input as any;
    const res = await client.run(input, { label: "test-run" });

    expect(res.status).toBe("completed");
    expect(res.run_id).toBe("test-run-ligation-123");
    expect(res.result?.rows?.[0].insert_mass_ng).toBe(45);
    expect(res.result?.rows?.[0].ul_water).toBe(13.75);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, req] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/run`);
    expect(req.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(req.body)).toEqual({
      input,
      options: { label: "test-run" },
    });
  });

  it("convenience calculate() calls run()", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    const input = mockManifest.examples[0].input as any;
    const res = await client.calculate(input);

    expect(res.status).toBe("completed");
    expect(res.result?.master_mix?.reaction_count).toBe(1);
    expect(res.result?.master_mix?.ul_buffer).toBe(2.2);
  });

  it("validates input and throws on invalid schema", async () => {
    const client = new PepkioClient({ apiKey: "test-token" });
    const invalidInput: any = {
      ligation_type: "invalid_type",
      calc_mode: "fixed_vector_mass",
    };

    await expect(client.run(invalidInput)).rejects.toThrow();
  });

  it("throws PepkioAPIError on HTTP error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({
          error: { message: "Invalid parameters", code: "VALIDATION_FAILED" },
        }),
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toMatchObject({
      name: "PepkioAPIError",
      status: 400,
      message: "Invalid parameters",
      code: "VALIDATION_FAILED",
    });
  });

  it("throws PepkioAPIError when run result contains error field", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "err-run",
          status: "failed",
          error: { message: "Calculation failed" },
        }),
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toMatchObject({
      name: "PepkioAPIError",
      message: "Calculation failed",
      runId: "err-run",
    });
  });

  it("retrieves run via getRun()", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.getRun("test-run-123");

    expect(res.run_id).toBe("test-run-ligation-123");
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/runs/test-run-123`,
    );
  });

  it("polls run until completion via waitForRun()", async () => {
    const queuedResponse = {
      run_id: "test-async-123",
      status: "running",
    };
    const completedResponse = {
      run_id: "test-async-123",
      status: "completed",
      result: mockRunResponse.result,
    };

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      const payload = callCount === 1 ? queuedResponse : completedResponse;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(payload),
      };
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.waitForRun("test-async-123", {
      intervalMs: 10,
      timeoutMs: 1000,
    });

    expect(res.status).toBe("completed");
    expect(callCount).toBe(2);
  });

  it("waitForRun() throws timeout error if exceeded", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ run_id: "stuck", status: "running" }),
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    await expect(
      client.waitForRun("stuck", { intervalMs: 10, timeoutMs: 50 }),
    ).rejects.toMatchObject({
      status: 408,
      message: expect.stringContaining("Timed out"),
    });
  });
});
