import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { evaluateOmegaGate } from "./omega-gate";
import { getLedgerHistory, getMerkleProof, getChainAnchor } from "./db";

const OmegaMetricsSchema = z.object({
  psi: z.number().min(0).max(1),
  theta: z.number().int().min(0),
  cvar: z.number().min(0).max(1),
  pole: z.number().int().min(0).max(1),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  omega: router({
    evaluate: protectedProcedure
      .input(OmegaMetricsSchema)
      .mutation(async ({ input }) => {
        return evaluateOmegaGate(input);
      }),
  }),

  ledger: router({
    history: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
      }).partial())
      .query(async ({ input }) => {
        return getLedgerHistory(input.limit || 100, input.offset || 0);
      }),
  }),

  proof: router({
    getMerkle: publicProcedure
      .input(z.string().length(64))
      .query(async ({ input }) => {
        return getMerkleProof(input);
      }),
    getChainAnchor: publicProcedure
      .input(z.string().length(64))
      .query(async ({ input }) => {
        return getChainAnchor(input);
      }),
  }),

  replay: router({
    execute: publicProcedure
      .input(z.object({
        startEventId: z.number().optional(),
        endEventId: z.number().optional(),
        verifyIntegrity: z.boolean().default(true),
      }))
      .query(async ({ input }) => {
        const { executeReplayPipeline } = await import('./replay-engine');
        return await executeReplayPipeline(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
