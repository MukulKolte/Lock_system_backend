const dns = require("dns");
const analyticsRoutes = require("./routes/analyticsRoutes");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const lockRoutes = require("./routes/lockRoutes");

dotenv.config();


// ======================================
// EXPRESS
// ======================================

const app = express();


// ======================================
// HTTP SERVER
// ======================================

const server = http.createServer(app);


// ======================================
// SOCKET.IO
// ======================================

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL
    }
});


// ======================================
// MIDDLEWARE
// ======================================

app.use(
    cors({
        origin: process.env.FRONTEND_URL
    })
);

app.use(express.json());


// ======================================
// DATABASE
// ======================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log("MongoDB connected");

    })
    .catch((error) => {

        console.error(
            "MongoDB connection failed:",
            error
        );

    });


// ======================================
// ROUTES
// ======================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/lock",
    lockRoutes
);


// ======================================
// HEALTH CHECK
// ======================================

app.get("/", (req, res) => {

    res.json({
        message: "Shared Lock API is running"
    });

});

app.use("/api/analytics", analyticsRoutes);


// ======================================
// SOCKET CONNECTION
// ======================================

io.on("connection", (socket) => {

    console.log(
        "Socket connected:",
        socket.id
    );

    socket.on("disconnect", () => {

        console.log(
            "Socket disconnected:",
            socket.id
        );

    });

});


// ======================================
// SERVER
// ======================================

const PORT = process.env.PORT || 5000;

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);