// SPDX-License-Identifier: MIT
import { z } from "zod";

export const ligationTypeSchema = z.enum([
  "sticky_end",
  "blunt_end",
  "ta_cloning",
  "golden_gate",
]);
export type LigationType = z.infer<typeof ligationTypeSchema>;

export const calcModeSchema = z.enum(["fixed_vector_mass", "insert_limited"]);
export type CalcMode = z.infer<typeof calcModeSchema>;

export const sizeUnitSchema = z.enum(["bp", "kb"]);
export type SizeUnit = z.infer<typeof sizeUnitSchema>;

export const concUnitSchema = z.enum(["ng_uL", "ug_mL"]);
export type ConcUnit = z.infer<typeof concUnitSchema>;

export const massUnitSchema = z.enum(["ng", "ug"]);
export type MassUnit = z.infer<typeof massUnitSchema>;

export const overageModeSchema = z.enum(["percent_10", "plus_one"]);
export type OverageMode = z.infer<typeof overageModeSchema>;

export const insertItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  size: z.number().positive("Insert size must be greater than 0"),
  size_unit: sizeUnitSchema.optional().default("bp"),
  concentration: z.number().positive("Insert concentration must be greater than 0"),
  conc_unit: concUnitSchema.optional().default("ng_uL"),
  molar_ratio: z.number().positive("Molar ratio must be greater than 0"),
  insert_mass_ng: z.number().positive().optional(),
}).passthrough();
export type InsertItem = z.infer<typeof insertItemSchema>;

export const ligationInputSchema = z.object({
  ligation_type: ligationTypeSchema,
  calc_mode: calcModeSchema,
  vector_size: z.number().positive("Vector size must be greater than 0"),
  vector_size_unit: sizeUnitSchema.optional().default("bp"),
  vector_concentration: z.number().positive("Vector concentration must be greater than 0"),
  vector_conc_unit: concUnitSchema.optional().default("ng_uL"),
  vector_mass: z.number().positive("Vector mass must be greater than 0"),
  vector_mass_unit: massUnitSchema.optional().default("ng"),
  vector_stock_ul: z.number().positive().optional(),
  reaction_volume_ul: z.number().positive("Reaction volume must be greater than 0"),
  ligase_volume_ul: z.number().nonnegative().optional().default(1),
  buffer_fraction: z.number().nonnegative().optional().default(0.1),
  overage_mode: overageModeSchema.optional().default("percent_10"),
  inserts: z.array(insertItemSchema).min(1, "At least one insert row is required"),
}).passthrough();
export type LigationInput = z.infer<typeof ligationInputSchema>;

export function parseRunInput(input: unknown): LigationInput {
  return ligationInputSchema.parse(input);
}
