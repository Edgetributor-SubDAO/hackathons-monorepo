import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { logger } from "../logger";

const STORAGE_DIR = join(process.cwd(), "data");
const STORAGE_FILE = join(STORAGE_DIR, "processed.json");

export class ProcessedStore {
  private processed: Set<string> = new Set();

  async init(): Promise<void> {
    try {
      await mkdir(STORAGE_DIR, { recursive: true });
      const data = await readFile(STORAGE_FILE, "utf-8").catch(() => "[]");
      const ids = JSON.parse(data) as string[];
      this.processed = new Set(ids);
      logger.info({ count: this.processed.size }, "Loaded processed deposit IDs");
    } catch (err) {
      logger.error({ err }, "Failed to load processed store");
    }
  }

  has(depositId: string): boolean {
    return this.processed.has(depositId);
  }

  async add(depositId: string): Promise<void> {
    this.processed.add(depositId);
    try {
      await writeFile(
        STORAGE_FILE,
        JSON.stringify(Array.from(this.processed), null, 2),
        "utf-8"
      );
    } catch (err) {
      logger.error({ err, depositId }, "Failed to persist processed store");
    }
  }
}

