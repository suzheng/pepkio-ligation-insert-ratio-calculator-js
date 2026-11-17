// SPDX-License-Identifier: MIT
import type {
  CalcMode,
  ConcUnit,
  InsertItem,
  LigationInput,
  LigationType,
  MassUnit,
  OverageMode,
  SizeUnit,
} from "./schemas.js";

export type {
  CalcMode,
  ConcUnit,
  InsertItem,
  LigationInput,
  LigationType,
  MassUnit,
  OverageMode,
  SizeUnit,
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = LigationResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface LigationProtocol {
  default_ratio?: number;
  incubation?: string;
  heat_inactivation?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface LigationRow {
  id?: string;
  name?: string;
  molar_ratio?: number;
  insert_mass_ng?: number;
  vector_mass_ng?: number;
  ul_insert?: number;
  ul_vector?: number;
  ul_buffer?: number;
  ul_ligase?: number;
  ul_water?: number;
  total_dna_ng?: number;
  valid?: boolean;
  warnings?: (string | { message?: string; code?: string })[];
  [key: string]: unknown;
}

export interface MasterMix {
  reaction_count?: number;
  overage_multiplier?: number;
  ul_buffer?: number;
  ul_ligase?: number;
  ul_water?: number;
  ul_water_total?: number;
  uniform_water?: boolean;
  ul_vector?: number;
  uniform_vector?: boolean;
  ul_core_mm_pooled?: number;
  [key: string]: unknown;
}

export interface LigationResult {
  ligation_type?: string;
  calc_mode?: string;
  protocol?: LigationProtocol;
  vector_bp?: number;
  vector_mass_ng?: number;
  reaction_volume_ul?: number;
  rows?: LigationRow[];
  master_mix?: MasterMix;
  global_warnings?: (string | { message?: string; code?: string })[];
  has_blocking_errors?: boolean;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
