/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

/**
 * Birkman Component IDs
 */
export const BirkmanComponentSchema = z.enum([
  "SE", "PE", "EE", "AS", "IN", "TH", "RE", "AU", "IC"
]);

export type BirkmanComponentId = z.infer<typeof BirkmanComponentSchema>;

/**
 * Single Question Schema
 */
export const QuestionSchema = z.object({
  id: z.number(),
  component: BirkmanComponentSchema,
  type: z.enum(["usual", "need"]),
  text: z.string(),
  isReversed: z.boolean().default(false),
});

export type BirkmanQuestion = z.infer<typeof QuestionSchema>;

/**
 * User Answer Schema
 */
export const AnswerSchema = z.object({
  questionId: z.number(),
  value: z.number().min(1).max(5), // 1-5 Likert Scale
});

export type UserAnswer = z.infer<typeof AnswerSchema>;

/**
 * Complete Assessment Result Schema
 */
export const BirkmanScoreSchema = z.object({
  usual: z.number().min(0).max(100),
  need: z.number().min(0).max(100),
});

export const BirkmanResultSchema = z.object({
  memberId: z.string().uuid().optional(),
  name: z.string().min(1),
  role: z.string().optional(),
  scores: z.record(BirkmanComponentSchema, BirkmanScoreSchema),
  primaryColor: z.enum(["red", "green", "yellow", "blue"]),
  timestamp: z.number(),
});

export type BirkmanResult = z.infer<typeof BirkmanResultSchema>;
