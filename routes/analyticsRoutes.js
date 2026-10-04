const express = require("express");

const LockSession = require("../models/LockSession");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();


// ======================================
// GET PERIOD BOUNDS
// ======================================

function getPeriodBounds(period, now) {

    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();


    if (period === "day") {

        return {
            start: new Date(
                Date.UTC(year, month, day)
            ),

            end: new Date(
                Date.UTC(year, month, day + 1)
            )
        };

    }


    if (period === "month") {

        return {
            start: new Date(
                Date.UTC(year, month, 1)
            ),

            end: new Date(
                Date.UTC(year, month + 1, 1)
            )
        };

    }


    if (period === "year") {

        return {
            start: new Date(
                Date.UTC(year, 0, 1)
            ),

            end: new Date(
                Date.UTC(year + 1, 0, 1)
            )
        };

    }


    return null;
}


// ======================================
// LOCK USAGE ANALYTICS
// ======================================
//
// GET
// /api/analytics/lock-usage?period=day
//
// period:
// day
// month
// year
//
// ======================================

router.get(
    "/lock-usage",
    requireAuth,
    async (req, res) => {

        try {

            const period =
                req.query.period || "day";


            const now = new Date();


            const bounds =
                getPeriodBounds(
                    period,
                    now
                );


            if (!bounds) {

                return res.status(400).json({

                    message:
                        "period must be day, month, or year"

                });
            }


            const sessions =
                await LockSession.find({

                    userId:
                        req.auth.userId,

                    lockedAt: {
                        $lt: bounds.end
                    },

                    $or: [

                        {
                            unlockedAt: {
                                $gt: bounds.start
                            }
                        },

                        {
                            unlockedAt: null
                        }

                    ]

                })
                .select(
                    "lockedAt unlockedAt status"
                )
                .lean();


            let totalMilliseconds = 0;

            let lockCount = 0;


            for (const session of sessions) {

                const sessionStart =
                    new Date(
                        session.lockedAt
                    ).getTime();


                const sessionEnd =
                    session.unlockedAt
                        ? new Date(
                            session.unlockedAt
                        ).getTime()
                        : now.getTime();


                const overlapStart =
                    Math.max(
                        sessionStart,
                        bounds.start.getTime()
                    );


                const overlapEnd =
                    Math.min(
                        sessionEnd,
                        bounds.end.getTime(),
                        now.getTime()
                    );


                if (
                    overlapEnd >
                    overlapStart
                ) {

                    totalMilliseconds +=
                        overlapEnd -
                        overlapStart;

                    lockCount++;
                }
            }


            const totalSeconds =
                Math.round(
                    totalMilliseconds / 1000
                );


            const totalHours =
                Math.round(
                    (
                        totalMilliseconds /
                        3600000
                    ) * 100
                ) / 100;


            return res.json({

                period,

                timezone: "UTC",

                from:
                    bounds.start.toISOString(),

                to:
                    bounds.end.toISOString(),

                lockCount,

                totalSeconds,

                totalHours

            });


        } catch (error) {

            console.error(
                "Lock analytics error:",
                error
            );


            return res.status(500).json({

                message:
                    "Could not load lock usage analytics"

            });
        }
    }
);


// ======================================
// GET RECENT LOCK / UNLOCK HISTORY
// ======================================
//
// GET
// /api/analytics/lock-history
//
// Optional:
// ?limit=10
//
// ======================================

router.get(
    "/lock-history",
    requireAuth,
    async (req, res) => {

        try {

            let limit =
                parseInt(
                    req.query.limit,
                    10
                );


            // Default to 10
            if (
                Number.isNaN(limit) ||
                limit <= 0
            ) {

                limit = 10;
            }


            // Prevent very large requests
            if (limit > 100) {

                limit = 100;
            }


            const sessions =
                await LockSession.find({

                    userId:
                        req.auth.userId

                })
                .sort({
                    lockedAt: -1
                })
                .limit(limit)
                .lean();


            const now = new Date();


            const events =
                sessions.map(
                    (session) => {

                        const lockedAt =
                            new Date(
                                session.lockedAt
                            );


                        const unlockedAt =
                            session.unlockedAt
                                ? new Date(
                                    session.unlockedAt
                                )
                                : null;


                        const endTime =
                            unlockedAt ||
                            now;


                        const durationMilliseconds =
                            Math.max(
                                0,
                                endTime.getTime() -
                                lockedAt.getTime()
                            );


                        const durationSeconds =
                            Math.floor(
                                durationMilliseconds /
                                1000
                            );


                        const durationHours =
                            Math.round(
                                (
                                    durationMilliseconds /
                                    3600000
                                ) * 100
                            ) / 100;


                        return {

                            id:
                                session._id,

                            lockedAt:
                                lockedAt.toISOString(),

                            unlockedAt:
                                unlockedAt
                                    ? unlockedAt.toISOString()
                                    : null,

                            durationSeconds,

                            durationHours,

                            status:
                                session.status

                        };

                    }
                );


            return res.json({

                events

            });


        } catch (error) {

            console.error(
                "Lock history error:",
                error
            );


            return res.status(500).json({

                message:
                    "Could not load lock history"

            });
        }
    }
);


module.exports = router;