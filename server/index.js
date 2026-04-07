const cluster = require("cluster");
const os = require("os");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const webSocketHandler = require("./controllers/chatApp/webSocket");
const routes = require("./routes/index");
const connectDB = require("./config/db");
const mailerRoutes = require("./nodemailer/routes");
const setupChatRoutes = require("./routes/chatApp/chatAppRoutes");
const requireAuth = require("./authentication/requireAuth");
const routeAccess = require("./authentication/routeAccess");

const numCPUs = os.cpus().length;
const USE_CLUSTER = false;

const PORT = process.env.PORT || 5000;

const startServer = () => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    },
  });

  // CORS configuration - allow all origins
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "x-page-route"],
  }));
  
  // Handle preflight requests
  app.options("*", cors());
  
  app.use(express.json());
  // Global authentication and route-access control
  app.use(requireAuth);
  app.use(routeAccess);

  app.use("/mail", mailerRoutes);

  connectDB()
    .then(() => console.log(`Database connected - PID ${process.pid}`))
    .catch((err) => console.error("Database connection error:", err));

  webSocketHandler(io);

  app.use("/", routes);
  app.use("/chatApp", setupChatRoutes(io));

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Server is running",
      pid: process.pid,
      timestamp: new Date().toISOString(),
    });
  });
  app.get("/auth/me", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Auth service is running",
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} - PID ${process.pid}`);
  });

  const gracefulShutdown = () => {
    server.close(() => {
      console.log(`Worker ${process.pid} closed`);
      process.exit(0);
    });
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
};

if (USE_CLUSTER && cluster.isMaster) {
  console.log(`Master PID ${process.pid} starting ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}
