import axios from "axios";
import type { Request } from "express";

/**
 * Single source of the Engine base URL. The Engine (services/engine) is an
 * internal inference module — only services/api may talk to it. The frontend
 * must never call the Engine directly (PRD §3.2, §11.2: one backend boundary).
 */
export const ENGINE_URL =
  process.env.ENGINE_URL || "https://aidcare-triage-production.up.railway.app";

/**
 * Forward an incoming multipart/form-data request straight through to the
 * Engine. The raw request stream is piped, so field names (e.g. `file`,
 * `audio_file`) and binary content pass through untouched. Returns the Engine's
 * JSON response body as-is (these endpoints are transparent proxies).
 */
export const streamMultipartToEngine = async <T = unknown>(
  req: Request,
  enginePath: string
): Promise<T> => {
  const response = await axios.post(`${ENGINE_URL}${enginePath}`, req, {
    headers: {
      "content-type": req.headers["content-type"] ?? "application/octet-stream",
      accept: "application/json",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return response.data as T;
};

/** Server-to-server JSON call to the Engine. */
export const postJsonToEngine = async <T = unknown>(
  enginePath: string,
  body: unknown
): Promise<T> => {
  const response = await axios.post(`${ENGINE_URL}${enginePath}`, body, {
    headers: { accept: "application/json", "Content-Type": "application/json" },
  });
  return response.data as T;
};
