import { promises as fs } from "fs";
import path from "path";

const defaultFile = path.resolve(__dirname, "../../data/processed.json");

export class ProcessedStore {
  private processed = new Set<string>();
  private readonly filePath: string;

  constructor(customPath?: string) {
    this.filePath = customPath ?? defaultFile;
  }

  async init(): Promise<void> {
    try {
      const contents = await fs.readFile(this.filePath, "utf-8");
      const ids = JSON.parse(contents) as string[];
      ids.forEach((id) => this.processed.add(id));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        await fs.writeFile(this.filePath, "[]");
      } else {
        throw err;
      }
    }
  }

  has(id: string): boolean {
    return this.processed.has(id);
  }

  async add(id: string): Promise<void> {
    if (this.processed.has(id)) {
      return;
    }
    this.processed.add(id);
    await this.persist();
  }

  private async persist(): Promise<void> {
    const payload = JSON.stringify(Array.from(this.processed), null, 2);
    await fs.writeFile(this.filePath, payload);
  }
}

