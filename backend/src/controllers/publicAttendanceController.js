import { getPublicSessionByQr } from "../services/sessionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPublicAttendanceSessionController = asyncHandler(async (req, res) => {
  const session = await getPublicSessionByQr(req.params.sessionId, req.query.token);

  res.json({
    success: true,
    data: session
  });
});
