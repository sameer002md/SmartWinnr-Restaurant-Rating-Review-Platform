
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";

import connectDB from "./config/db.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load environment variables
dotenv.config();

// Configure DNS for MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Initialize Express
const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());

// Welcome API
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to SmartWinnr Restaurant Rating Platform API"
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SmartWinnr Backend is healthy",
        status: "Running"
    });
});

// Authentication APIs
app.use("/api/auth", authRoutes);

// Restaurant APIs
app.use("/api/restaurants", restaurantRoutes);

// Review APIs
app.use("/api/reviews", reviewRoutes);

// Admin user management APIs
// Register specific route before general admin route
app.use("/api/admin/users", adminUserRoutes);

// General admin APIs
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Server Error:", error);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal Server Error"
    });
});

// Start server
const startServer = async () => {
    try {
        console.log("Starting SmartWinnr Backend...");
        console.log("DNS configured successfully");

        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log("-----------------------------------");
            console.log("SmartWinnr Backend Started!");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
            console.log("Authentication APIs: Connected");
            console.log("Restaurant APIs: Connected");
            console.log("Review APIs: Connected");
            console.log("Admin APIs: Connected");
            console.log("Admin User APIs: Connected");
            console.log("-----------------------------------");
        });

    } catch (error) {
        console.error("Backend startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
