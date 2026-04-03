import express from "express";
import {
  getUserOnlineStatus,
  getUserInfo,
  getTeamInfo,
} from "../controllers/user.controller";
import { getVoteInfo } from "../controllers/peak.controller";

const router: express.Router = express.Router();

router.get("/getUserOnlineStatus", getUserOnlineStatus);
router.get("/getUserInfo", getUserInfo);
router.get("/getTeamInfo", getTeamInfo);

router.get("/getVoteInfo", getVoteInfo);

export default router;
