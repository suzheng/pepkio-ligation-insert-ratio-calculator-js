// SPDX-License-Identifier: MIT

export {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";

export {
  calcModeSchema,
  concUnitSchema,
  insertItemSchema,
  ligationInputSchema,
  ligationTypeSchema,
  massUnitSchema,
  overageModeSchema,
  parseRunInput,
  sizeUnitSchema,
  type CalcMode,
  type ConcUnit,
  type InsertItem,
  type LigationInput,
  type LigationType,
  type MassUnit,
  type OverageMode,
  type SizeUnit,
} from "./schemas.js";

export {
  PepkioAPIError,
  type ExampleMeta,
  type LigationProtocol,
  type LigationResult,
  type LigationRow,
  type ManifestExample,
  type MasterMix,
  type RunOptions,
  type RunResult,
  type RunStatus,
  type ToolManifest,
} from "./types.js";

export {
  PepkioClient,
  type PepkioClientOptions,
} from "./client.js";

import { PepkioClient } from "./client.js";
export default PepkioClient;
