
import express from "express";
import MonitoringLog from "../models/MonitoringLog.js";
import Centre from "../models/Centre.js";
import { calculateCompliance } from "../utils/compliance.js";

const router = express.Router();

router.post("/ingest", async (req, res) => {
  try {

    const {
      centreId,
      classroomId,
      peopleCount,
      objects
    } = req.body;

    const centre = await Centre.findById(centreId);

    if (!centre) {
      return res.status(404).json({
        message: "Centre not found"
      });
    }

    const result = calculateCompliance(
      objects,
      centre.requirements
    );

    const log = await MonitoringLog.create({
      centreId,
      classroomId,
      peopleCount,
      objects,
      complianceScore: result.score,
      issues: result.issues
    });

    req.app.get("io").emit("monitoring:update", log);

    if (result.issues.length > 0) {
      req.app.get("io").emit("alert:new", {
        centreId,
        issues: result.issues
      });
    }

    res.status(201).json({
      success: true,
      compliance: result,
      data: log
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

router.get("/:centreId", async (req, res) => {
  try {
    const logs = await MonitoringLog.find({
      centreId: req.params.centreId
    })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

export default router;
