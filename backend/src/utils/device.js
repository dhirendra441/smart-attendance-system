import crypto from "crypto";
import { normalizeText } from "./normalize.js";

const pickIpAddress = (ipAddress = "") =>
  ipAddress.includes("::ffff:") ? ipAddress.replace("::ffff:", "") : ipAddress;

export const buildDeviceContext = ({ ipAddress, userAgent, clientMeta = {} }) => {
  const normalizedIp = pickIpAddress(ipAddress || "unknown-ip");
  const normalizedAgent = normalizeText(userAgent || "unknown-agent");
  const platform = normalizeText(clientMeta.platform || "unknown-platform");
  const timezone = normalizeText(clientMeta.timezone || "unknown-timezone");
  const language = normalizeText(clientMeta.language || "unknown-language");
  const screen = normalizeText(clientMeta.screen || "unknown-screen");

  const rawSignature = [normalizedIp, normalizedAgent, platform, timezone, language, screen].join("|");
  const browserSignature = crypto.createHash("sha256").update(rawSignature).digest("hex");

  return {
    ipAddress: normalizedIp,
    userAgent: normalizedAgent,
    browserSignature,
    clientMeta: {
      platform,
      timezone,
      language,
      screen
    }
  };
};
