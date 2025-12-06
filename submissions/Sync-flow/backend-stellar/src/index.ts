import "dotenv/config";
import { BridgeRelayer } from "./relayer";
import { logger } from "./logger";

const relayer = new BridgeRelayer();

async function main() {
  await relayer.start();

  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down...");
    await relayer.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down...");
    await relayer.shutdown();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(err, "Relayer failed to start");
  process.exit(1);
});
