const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// =============================
// REGISTER
// =============================

router.post("/register", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters"
            });
        }

        const existingUser = await User.findOne({
            username
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        const user = await User.create({
            username,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            userId: user._id
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Registration failed"
        });
    }
});


// =============================
// LOGIN
// =============================

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        const user = await User.findOne({
            username
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});


module.exports = router;