import { app, logger, httpServer } from "@/server";

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";

httpServer.listen(PORT, HOST, () => {
  const { NODE_ENV } = process.env;
  logger.info(`Server (${NODE_ENV}) running on http://${HOST}:${PORT}`);
  logger.info(`WebSocket server available at ws://${HOST}:${PORT}/socket.io/`);
});

const onCloseSignal = () => {
  logger.info("sigint received, shutting down");
  httpServer.close(() => {
    logger.info("server closed");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
