import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import type { WorkersAiBinding } from "./sources/semantic-rerank";
import { authenticateRequest } from "./kimi/auth";

/** Runtime bindings injected by the Cloudflare Worker entry point. */
export type RuntimeEnv = {
  AI?: WorkersAiBinding;
  [key: string]: unknown;
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  /** Present on Cloudflare Workers; undefined on the Node target. */
  env?: RuntimeEnv;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
