import express from "express";
import { tcpService } from "./tcpService";
import { PacketBuilder } from "../utils/pkgBuilder";

const app: express.Application = express();
app.use(express.json());

app.get("/api/getUserInfo", async (req, res) => {
  const cmdId = 2052;
  const account = Number(req.query.account) || 744152911;

  try {
    const queryPacketHex = new PacketBuilder()
      .setCmdId(cmdId)
      .addU32(account)
      .build();

    const responseBuffer = await tcpService.sendAndReceive(
      cmdId,
      queryPacketHex
    );

    if (responseBuffer) {
      res.json({
        success: true,
        message: "获取成功",
        data: responseBuffer.toString("hex").toUpperCase(),
      });
    } else {
      res.status(504).json({ success: false, error: "等待响应超时" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export { app };
