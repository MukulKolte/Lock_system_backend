const express = require("express");

const Lock = require("../models/Lock");

const authenticate = require("../middleware/auth");

const router = express.Router();


// ======================================
// GET CURRENT LOCK STATUS
// ======================================

router.get("/", authenticate, async (req, res) => {

    try {

        let lock = await Lock.findById("main-lock")
            .populate("lockedBy", "username");

        if (!lock) {

            lock = await Lock.create({
                _id: "main-lock",
                locked: false
            });
        }

        res.json(lock);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to get lock status"
        });
    }
});


// ======================================
// LOCK SYSTEM
// ======================================

router.post("/lock", authenticate, async (req, res) => {

    try {

        /*
         * IMPORTANT:
         *
         * We only update the document if
         * locked === false.
         *
         * This prevents two users from
         * acquiring the lock simultaneously.
         */

        const lock = await Lock.findOneAndUpdate(
            {
                _id: "main-lock",
                locked: false
            },
            {
                locked: true,
                lockedBy: req.user.userId,
                lockedAt: new Date()
            },
            {
                new: true
            }
        ).populate("lockedBy", "username");


        if (!lock) {

            return res.status(409).json({
                message: "System is already locked"
            });
        }


        // We'll emit Socket.IO event later.


        res.json({
            message: "System locked successfully",
            lock
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to lock system"
        });
    }
});


// ======================================
// UNLOCK SYSTEM
// ======================================

router.post("/unlock", authenticate, async (req, res) => {

    try {

        const lock = await Lock.findById("main-lock");


        if (!lock || !lock.locked) {

            return res.status(400).json({
                message: "System is already unlocked"
            });
        }


        // ==================================
        // OWNERSHIP CHECK
        // ==================================

        if (
            lock.lockedBy.toString()
            !==
            req.user.userId
        ) {

            return res.status(403).json({
                message:
                    "Only the user who locked the system can unlock it"
            });
        }


        lock.locked = false;
        lock.lockedBy = null;
        lock.lockedAt = null;

        await lock.save();


        res.json({
            message: "System unlocked successfully",
            lock
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to unlock system"
        });
    }
});


module.exports = router;