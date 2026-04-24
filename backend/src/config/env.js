import dotenv from "dotenv";
import os from "os";
import { execFileSync } from "child_process";

dotenv.config();

const normalizeUrl = (value, fallback) => (value || fallback).replace(/\/$/, "");
const getWindowsPrimaryIpAddress = () => {
  if (process.platform !== "win32") {
    return "";
  }

  try {
    const command = [
      "$route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Sort-Object RouteMetric, ifMetric | Select-Object -First 1;",
      "if ($route) {",
      "  Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 |",
      "    Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -notlike '127.*' } |",
      "    Select-Object -First 1 -ExpandProperty IPAddress",
      "}"
    ].join(" ");

    return execFileSync("powershell.exe", ["-NoProfile", "-Command", command], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch (error) {
    return "";
  }
};

const scoreAddressCandidate = ({ interfaceName, address }) => {
  let score = 0;
  const normalizedName = interfaceName.toLowerCase();

  if (/wi-?fi|wlan|ethernet|en\d|eth\d/.test(normalizedName)) {
    score += 40;
  }

  if (/virtual|virtualbox|vmware|hyper-v|docker|wsl|loopback|pseudo|vethernet/.test(normalizedName)) {
    score -= 100;
  }

  if (address.startsWith("10.")) {
    score += 30;
  }

  if (address.startsWith("192.168.")) {
    score += 20;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) {
    score += 15;
  }

  if (address.startsWith("192.168.56.")) {
    score -= 100;
  }

  return score;
};

const getFallbackLocalIpAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  const candidates = [];

  for (const [interfaceName, interfaceDetails] of Object.entries(networkInterfaces)) {
    for (const address of interfaceDetails || []) {
      if (address.family === "IPv4" && !address.internal && !address.address.startsWith("169.254.")) {
        candidates.push({
          interfaceName,
          address: address.address
        });
      }
    }
  }

  if (!candidates.length) {
    return "localhost";
  }

  candidates.sort((left, right) => scoreAddressCandidate(right) - scoreAddressCandidate(left));
  return candidates[0].address;
};

const getLocalIpAddress = () => {
  const windowsPrimaryIp = getWindowsPrimaryIpAddress();

  if (windowsPrimaryIp) {
    return windowsPrimaryIp;
  }

  return getFallbackLocalIpAddress();
};

const localIpAddress = getLocalIpAddress();
const autoFrontendBaseUrl = `http://${localIpAddress}:5173`;
const autoClientOrigins = ["http://localhost:5173", autoFrontendBaseUrl];

const parseOrigins = (value) => {
  const rawOrigins = (value || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const expandedOrigins = rawOrigins.flatMap((origin) =>
    origin.toLowerCase() === "auto" ? autoClientOrigins : [normalizeUrl(origin, origin)]
  );

  return [...new Set(expandedOrigins)];
};

const resolveFrontendBaseUrl = (value) => {
  const normalizedValue = (value || "").trim();

  if (!normalizedValue || normalizedValue.toLowerCase() === "auto") {
    return autoFrontendBaseUrl;
  }

  return normalizeUrl(normalizedValue, autoFrontendBaseUrl);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb+srv://<username>:<password>@<cluster-url>/smart-attendance?retryWrites=true&w=majority",
  localIpAddress,
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN || "http://localhost:5173,auto"),
  frontendBaseUrl: resolveFrontendBaseUrl(process.env.FRONTEND_BASE_URL),
  jwtSecret: process.env.JWT_SECRET || "smart-attendance-demo-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d"
};
