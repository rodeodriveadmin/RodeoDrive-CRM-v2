import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// File-storage abstraction for the drive cluster.
// Development / single-server: local directory (STORAGE_DIR, default ./storage).
// Production scale-out: swap in an S3-compatible driver (Cloudflare R2 / MinIO)
// behind this same interface — no caller changes needed.

export interface StorageDriver {
  save(bytes: Buffer): Promise<string>; // returns storagePath
  read(storagePath: string): Promise<Buffer>;
  remove(storagePath: string): Promise<void>;
}

const STORAGE_DIR = process.env.STORAGE_DIR || "./storage";

// storagePath is an opaque id we generate — never user input — but keep the
// guard anyway so a corrupted DB row can never escape the storage dir.
function safeName(storagePath: string): string {
  if (!/^[a-z0-9-]+$/i.test(storagePath)) throw new Error("INVALID_STORAGE_PATH");
  return storagePath;
}

const localDriver: StorageDriver = {
  async save(bytes) {
    await mkdir(STORAGE_DIR, { recursive: true });
    const id = randomUUID();
    await writeFile(join(STORAGE_DIR, id), bytes);
    return id;
  },
  async read(storagePath) {
    return readFile(join(STORAGE_DIR, safeName(storagePath)));
  },
  async remove(storagePath) {
    try {
      await unlink(join(STORAGE_DIR, safeName(storagePath)));
    } catch {
      /* already gone */
    }
  },
};

export const storage: StorageDriver = localDriver;

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
