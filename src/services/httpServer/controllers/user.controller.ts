import { Request, Response } from "express";
import { tcpService } from "../../tcpService";
import { PacketBuilder } from "../../../utils/pkgBuilder";
import { BufferReader } from "../../../utils/reader";
import { badRequest, fail, notFound, success } from "../../../utils/reply";
import {
  isValidAccount,
  getInvalidAccountRes,
  toHexStr,
} from "../../../utils/httpUtil";

interface NicknameResult {
  success: boolean;
  nickName?: string;
  hexData?: string;
}

async function fetchNickname(account: number): Promise<NicknameResult> {
  const pkt = new PacketBuilder().setCmdId(2052).addU32(account).build();
  const res = await tcpService.sendAndReceive(2052, pkt);
  if (!res || res.length <= 39) return { success: false };
  const reader = new BufferReader(res);
  reader.skip(4);
  return {
    success: true,
    nickName: reader.readString(16),
    hexData: toHexStr(res),
  };
}

interface OnlineResult {
  online: boolean;
  server?: string;
}

async function fetchOnlineStatus(account: number): Promise<OnlineResult> {
  const pkt = new PacketBuilder()
    .setCmdId(2157)
    .addU32(1)
    .addU32(account)
    .build();
  const res = await tcpService.sendAndReceive(2157, pkt);
  if (!res || res.length < 12) return { online: false };
  const reader = new BufferReader(res);
  const isOnline = reader.readUInt32() === 1;
  reader.skip(4);
  const server = String(reader.readUInt32());
  return { online: isOnline, ...(isOnline ? { server } : {}) };
}

// 查询用户在线状态
export async function getUserOnlineStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const account = Number(req.query.account);

  if (!isValidAccount(account)) {
    const invalidAccountRes = getInvalidAccountRes(account);
    res.json(badRequest(invalidAccountRes.message, invalidAccountRes.data));
    return;
  }

  try {
    const nicknameResult = await fetchNickname(account);
    if (!nicknameResult.success) {
      res.json(
        notFound("数据返回失败", {
          account: String(account),
          error: "该米米号的信息不存在",
        }),
      );
      return;
    }

    const onlineResult = await fetchOnlineStatus(account);

    res.json(
      success(
        {
          account: String(account),
          nickName: nicknameResult.nickName,
          ...onlineResult,
        },
        "数据返回成功",
      ),
    );
  } catch (error) {
    res.json(
      fail("数据返回失败", {
        account: String(account),
        error: (error as Error).message,
      }),
    );
  }
}

// 获取米米号详细信息
export async function getUserInfo(req: Request, res: Response): Promise<void> {
  const account = Number(req.query.account);

  if (!isValidAccount(account)) {
    const invalidAccountRes = getInvalidAccountRes(account, true);
    res.json(
      badRequest(invalidAccountRes.message, invalidAccountRes.data, {
        status: invalidAccountRes.status,
      }),
    );
    return;
  }

  try {
    // 验证账号是否存在
    const nicknameResult = await fetchNickname(account);
    if (!nicknameResult.success) {
      res.json(
        notFound(
          "数据返回失败",
          { account: String(account), error: "该米米号的信息不存在" },
          { status: 1 },
        ),
      );
      return;
    }

    // 获取在线状态和简单信息
    const [onlineResult, hexDataSimple] = await Promise.all([
      fetchOnlineStatus(account),
      (async () => {
        const pkt = new PacketBuilder().setCmdId(2051).addU32(account).build();
        return toHexStr(await tcpService.sendAndReceive(2051, pkt));
      })(),
    ]);

    // 成就/精灵信息
    const pkt41298_1 = new PacketBuilder()
      .setCmdId(41298)
      .addU32(1)
      .addU32(account)
      .addU32(0)
      .addU32(0)
      .build();
    const hexDataPrat1 = toHexStr(
      await tcpService.sendAndReceive(41298, pkt41298_1),
    );

    const pkt41298_5 = new PacketBuilder()
      .setCmdId(41298)
      .addU32(5)
      .addU32(account)
      .addU32(0)
      .addU32(0)
      .build();
    const hexDataPrat2 = toHexStr(
      await tcpService.sendAndReceive(41298, pkt41298_5),
    );

    // 巅峰信息
    const peakParams = [
      124801,
      124802,
      124804,
      124805, // 竞技
      124791,
      124792,
      124793,
      124794, // 狂野
      129441,
      129443,
      129446,
      129447, // 专家
    ];

    let hexDataPeak = "";
    for (const param of peakParams) {
      const pkt = new PacketBuilder()
        .setCmdId(40002)
        .addU32(account)
        .addU32(param)
        .build();
      hexDataPeak += toHexStr(await tcpService.sendAndReceive(40002, pkt));
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    res.json(
      success(
        {
          account: String(account),
          nickName: nicknameResult.nickName,
          hexDataMore: nicknameResult.hexData,
          ...onlineResult,
          hexDataSimple,
          hexDataPrat1,
          hexDataPrat2,
          hexDataPeak,
        },
        "数据返回成功",
        200,
        { status: 1 },
      ),
    );
  } catch (error) {
    res.json(
      fail(
        "数据返回失败",
        { account: String(account), error: (error as Error).message },
        500,
        { status: 1 },
      ),
    );
  }
}

// 获取战队信息
export async function getTeamInfo(req: Request, res: Response): Promise<void> {
  const teamId = Number(req.query.teamId);

  if (!teamId || isNaN(teamId) || teamId <= 0) {
    res.json(badRequest("数据返回失败", { error: "请输入有效的战队ID" }));
    return;
  }

  try {
    const pkt = new PacketBuilder().setCmdId(2917).addU32(teamId).build();
    const result = await tcpService.sendAndReceive(2917, pkt);

    if (result && result.length > 0) {
      res.json(
        success(
          { teamId: String(teamId), hexDataTeam: toHexStr(result) },
          "获取成功",
        ),
      );
      return;
    }

    res.json(notFound("数据返回失败", { error: "该战队号的信息不存在" }));
  } catch (error) {
    res.json(fail("数据返回失败", { error: (error as Error).message }));
  }
}
