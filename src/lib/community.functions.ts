import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import devs from "@/data/devs.json";

export type Dev = { discord_id: string; username: string; avatar_url: string | null; contact: string | null };

export const getDevs = createServerFn({ method: "GET" }).handler(async (): Promise<Dev[]> => {
  return devs;
});

const applySchema = z.object({
  discord: z.string().trim().min(2).max(40),
  age: z.number().int().min(5).max(99),
  why: z.string().trim().min(10).max(1000),
  experience: z.string().trim().min(2).max(1000),
});

export const applyTester = createServerFn({ method: "POST" })
  .inputValidator((d) => applySchema.parse(d))
  .handler(async ({ data }) => {
    return { ok: false, error: "Applications aren't open yet." };
  });
