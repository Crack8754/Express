import { readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, "..", "data", "events.json");
const tempFile = path.join(__dirname, "..", "data", "events.tmp.json");

export class DataFileError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "DataFileError";
    this.cause = cause;
  }
}

export async function readEvents() {
  try {
    const data = await readFile(dataFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    throw new DataFileError(
      "Не вдалося прочитати або зберегти події",
      error
    );
  }
}

export async function writeEvents(events) {
  try {
    const data = JSON.stringify(events, null, 2);

    await writeFile(tempFile, data, "utf-8");
    await rename(tempFile, dataFile);
  } catch (error) {
    throw new DataFileError(
      "Не вдалося прочитати або зберегти події",
      error
    );
  }
}