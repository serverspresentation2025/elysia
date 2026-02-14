import { Elysia } from "elysia";

// Configuration from environment variables
const config = {
  port: parseInt(process.env.PORT || "3000"),
  hostname: process.env.HOSTNAME || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
};

// Structured logging utility
const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    console.error(JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      error: error?.message,
      stack: error?.stack,
      ...meta,
    }));
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(JSON.stringify({
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
};

const app = new Elysia()
  // Security headers middleware
  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
    
    if (config.nodeEnv === "production") {
      set.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }
  })
  
  // Request logging middleware
  .onRequest(({ request, set }) => {
    const startTime = Date.now();
    set.headers["X-Request-ID"] = crypto.randomUUID();
    
    logger.info("Incoming request", {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get("user-agent"),
    });
    
    // Store start time for response logging
    (request as any)._startTime = startTime;
  })
  
  // Response logging middleware
  .onAfterHandle(({ request, set }) => {
    const duration = Date.now() - ((request as any)._startTime || Date.now());
    logger.info("Request completed", {
      method: request.method,
      url: request.url,
      statusCode: set.status,
      duration: `${duration}ms`,
    });
  })
  
  // Global error handling
  .onError(({ code, error, set, request }) => {
    logger.error("Request error", error, {
      code,
      method: request.method,
      url: request.url,
    });

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: "Not Found",
        message: "The requested resource was not found",
        timestamp: new Date().toISOString(),
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Validation Error",
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    if (code === "INTERNAL_SERVER_ERROR") {
      set.status = 500;
      return {
        error: "Internal Server Error",
        message: config.nodeEnv === "production" 
          ? "An unexpected error occurred" 
          : error.message,
        timestamp: new Date().toISOString(),
      };
    }

    set.status = 500;
    return {
      error: "Error",
      message: config.nodeEnv === "production" 
        ? "An error occurred processing your request" 
        : error.message,
      timestamp: new Date().toISOString(),
    };
  })
  
  // Health check endpoint for monitoring and load balancers
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  }))
  
  // Readiness check endpoint
  .get("/ready", () => ({
    status: "ready",
    timestamp: new Date().toISOString(),
  }))
  
  // Metrics endpoint (basic)
  .get("/metrics", () => ({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
  }))
  
  // Main application route
  .get("/", () => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Cloud-deployed application using Defang, AWS, and modern web technologies">
      <title>Defang Deployment</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* Animated background particles */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(100, 200, 255, 0.8), rgba(100, 200, 255, 0));
          border-radius: 50%;
          animation: float 20s infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        .container {
          text-align: center;
          z-index: 10;
          position: relative;
          max-width: 900px;
          padding: 40px;
        }

        h1 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 40px;
          background: linear-gradient(45deg, #00d4ff, #0099ff, #00d4ff);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease infinite, glow 2s ease-in-out infinite;
          text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
          letter-spacing: 2px;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(0, 212, 255, 0.5), 0 0 30px rgba(0, 153, 255, 0.3);
          }
          50% {
            text-shadow: 0 0 30px rgba(0, 212, 255, 0.8), 0 0 60px rgba(0, 153, 255, 0.6), 0 0 90px rgba(0, 100, 255, 0.4);
          }
        }

        .message {
          font-size: 1.8rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.8;
          margin: 30px 0;
          animation: fadeInUp 1s ease-out 0.5s both;
        }

        .highlight {
          color: #00d4ff;
          font-weight: 600;
          text-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
          animation: highlightGlow 1.5s ease-in-out infinite;
        }

        @keyframes highlightGlow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
          }
          50% {
            text-shadow: 0 0 20px rgba(0, 212, 255, 1), 0 0 30px rgba(0, 153, 255, 0.6);
          }
        }

        .subtitle {
          font-size: 1rem;
          color: rgba(150, 200, 255, 0.8);
          margin-top: 50px;
          animation: fadeInUp 1s ease-out 1s both;
        }

        .tech-badges {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 40px;
          flex-wrap: wrap;
          animation: fadeInUp 1s ease-out 1.5s both;
        }

        .badge {
          padding: 10px 20px;
          border: 2px solid rgba(0, 212, 255, 0.5);
          border-radius: 25px;
          color: #00d4ff;
          font-size: 0.9rem;
          font-weight: 600;
          background: rgba(0, 212, 255, 0.1);
          transition: all 0.3s ease;
          cursor: default;
        }

        .badge:hover {
          border-color: #00d4ff;
          background: rgba(0, 212, 255, 0.2);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
          transform: translateY(-2px);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          h1 {
            font-size: 2.5rem;
          }
          .message {
            font-size: 1.3rem;
          }
          .container {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="particles" id="particles"></div>
      <div class="container">
        <h1>✨ Cloud Deployed ✨</h1>
        <div class="message">
          I deployed this to the cloud using <span class="highlight">Defang</span>, <span class="highlight">AWS</span>, and <span class="highlight">GitHub Copilot</span> in <span class="highlight">10 minutes</span>
        </div>
        <div class="tech-badges">
          <div class="badge">Elysia</div>
          <div class="badge">Bun</div>
          <div class="badge">Defang</div>
          <div class="badge">AWS</div>
          <div class="badge">TypeScript</div>
        </div>
        <div class="subtitle">Ethereal • Futuristic • Fast</div>
      </div>

      <script>
        // Generate animated particles
        function createParticles() {
          const container = document.getElementById('particles');
          for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 100 + 20;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = Math.random() * 5 + 's';
            container.appendChild(particle);
          }
        }
        createParticles();
      </script>
    </body>
    </html>
  `)
  .listen({
    hostname: config.hostname,
    port: config.port,
  });

logger.info("Server started", {
  hostname: app.server?.hostname,
  port: app.server?.port,
  environment: config.nodeEnv,
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  logger.info("Shutdown signal received", { signal });
  
  try {
    await app.stop();
    logger.info("Server stopped gracefully");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", error as Error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Unhandled rejection handling
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", new Error(String(reason)), {
    promise: String(promise),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error);
  process.exit(1);
});
