#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/src/cdn.ts
var https = __toESM(require("node:https"), 1);
var http = __toESM(require("node:http"), 1);
var fs = __toESM(require("node:fs"), 1);
var path = __toESM(require("node:path"), 1);
var readline = __toESM(require("node:readline"), 1);
var C = {
  r: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[90m",
  red: "\x1B[91m",
  green: "\x1B[92m",
  yellow: "\x1B[93m",
  blue: "\x1B[94m",
  magenta: "\x1B[95m",
  cyan: "\x1B[96m",
  white: "\x1B[97m"
};
function info(msg) {
  console.log(`${C.cyan}  [*]${C.r} ${msg}`);
}
function success(msg) {
  console.log(`${C.green}  [+]${C.r} ${msg}`);
}
function warn(msg) {
  console.log(`${C.yellow}  [!]${C.r} ${msg}`);
}
function error(msg) {
  console.log(`${C.red}  [-]${C.r} ${msg}`);
}
function divider() {
  console.log(`${C.dim}  ${"\u2500".repeat(50)}${C.r}`);
}
function printBanner() {
  console.log(
    C.cyan + `
   _____ ____  _   _   _____    _       _
  / ____|  _ \\| \\ | | |  ___|__| |_ ___| |__   ___ _ __
 | |    | | | |  \\| | | |_ / _ | __/ __| '_ \\ / _ | '__|
 | |___ | |_| | |\\  | |  _|  __| || (__| | | |  __| |
  \\_____|____/|_| \\_| |_|  \\___|\\__\\___|_| |_|\\___|_|
` + C.r
  );
  console.log(
    `${C.white}  CDN IP Range Fetcher & CIDR-to-IP Converter${C.r}`
  );
  console.log(
    `${C.dim}  Grab CIDR blocks from 20+ CDN & cloud providers${C.r}`
  );
  console.log(
    `${C.dim}  Created by ${C.white}Krainium${C.r}`
  );
  divider();
  console.log();
}
function httpGet(url, headers) {
  return new Promise((resolve2, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const opts = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ...headers
      },
      timeout: 15e3
    };
    mod.get(url, opts, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location, headers).then(resolve2).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve2(Buffer.concat(chunks).toString()));
      res.on("error", reject);
    }).on("error", reject).on("timeout", () => reject(new Error(`Timeout fetching ${url}`)));
  });
}
async function fetchPlainTextCIDRs(...urls) {
  const all = [];
  for (const url of urls) {
    const body = await httpGet(url);
    const lines = body.split("\n").map((l) => l.trim()).filter((l) => l && l.includes("/"));
    all.push(...lines);
  }
  return all;
}
var providers = [
  {
    name: "Cloudflare",
    slug: "cloudflare",
    description: "Global CDN, DDoS protection, DNS",
    async fetch() {
      return fetchPlainTextCIDRs(
        "https://www.cloudflare.com/ips-v4",
        "https://www.cloudflare.com/ips-v6"
      );
    }
  },
  {
    name: "CloudFront (AWS CDN)",
    slug: "cloudfront",
    description: "Amazon Web Services CDN",
    async fetch() {
      const body = await httpGet(
        "https://ip-ranges.amazonaws.com/ip-ranges.json"
      );
      const data = JSON.parse(body);
      const v4 = data.prefixes.filter((p) => p.service === "CLOUDFRONT").map((p) => p.ip_prefix);
      const v6 = data.ipv6_prefixes.filter((p) => p.service === "CLOUDFRONT").map((p) => p.ipv6_prefix);
      return [...v4, ...v6];
    }
  },
  {
    name: "AWS (All Services)",
    slug: "aws",
    description: "All Amazon Web Services IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://ip-ranges.amazonaws.com/ip-ranges.json"
      );
      const data = JSON.parse(body);
      const v4 = data.prefixes.map((p) => p.ip_prefix);
      const v6 = data.ipv6_prefixes.map((p) => p.ipv6_prefix);
      return [...v4, ...v6];
    }
  },
  {
    name: "AWS EC2",
    slug: "aws-ec2",
    description: "Amazon EC2 compute IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://ip-ranges.amazonaws.com/ip-ranges.json"
      );
      const data = JSON.parse(body);
      const v4 = data.prefixes.filter((p) => p.service === "EC2").map((p) => p.ip_prefix);
      const v6 = data.ipv6_prefixes.filter((p) => p.service === "EC2").map((p) => p.ipv6_prefix);
      return [...v4, ...v6];
    }
  },
  {
    name: "AWS S3",
    slug: "aws-s3",
    description: "Amazon S3 storage IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://ip-ranges.amazonaws.com/ip-ranges.json"
      );
      const data = JSON.parse(body);
      const v4 = data.prefixes.filter((p) => p.service === "S3").map((p) => p.ip_prefix);
      const v6 = data.ipv6_prefixes.filter((p) => p.service === "S3").map((p) => p.ipv6_prefix);
      return [...v4, ...v6];
    }
  },
  {
    name: "Fastly",
    slug: "fastly",
    description: "Edge cloud CDN platform",
    async fetch() {
      const body = await httpGet("https://api.fastly.com/public-ip-list");
      const data = JSON.parse(body);
      return [...data.addresses || [], ...data.ipv6_addresses || []];
    }
  },
  {
    name: "Google Cloud",
    slug: "google-cloud",
    description: "Google Cloud Platform IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://www.gstatic.com/ipranges/cloud.json"
      );
      const data = JSON.parse(body);
      return data.prefixes.map(
        (p) => p.ipv4Prefix || p.ipv6Prefix
      ).filter(Boolean);
    }
  },
  {
    name: "Google (All Services)",
    slug: "google-services",
    description: "All Google services (Search, Gmail, YouTube, etc.)",
    async fetch() {
      const body = await httpGet(
        "https://www.gstatic.com/ipranges/goog.json"
      );
      const data = JSON.parse(body);
      return data.prefixes.map(
        (p) => p.ipv4Prefix || p.ipv6Prefix
      ).filter(Boolean);
    }
  },
  {
    name: "Microsoft Azure",
    slug: "azure",
    description: "Microsoft Azure cloud IP ranges",
    async fetch() {
      const page = await httpGet(
        "https://www.microsoft.com/en-us/download/confirmation.aspx?id=56519"
      );
      const match = page.match(
        /https:\/\/download\.microsoft\.com\/download\/[^"]+ServiceTags[^"]+\.json/
      );
      if (!match) throw new Error("Could not find Azure ServiceTags download URL");
      const body = await httpGet(match[0]);
      const data = JSON.parse(body);
      const cidrs = [];
      for (const val of data.values || []) {
        if (val.properties && val.properties.addressPrefixes) {
          cidrs.push(...val.properties.addressPrefixes);
        }
      }
      return [...new Set(cidrs)];
    }
  },
  {
    name: "GitHub",
    slug: "github",
    description: "GitHub services (hooks, pages, actions, copilot, etc.)",
    async fetch() {
      const body = await httpGet("https://api.github.com/meta", {
        Accept: "application/vnd.github.v3+json"
      });
      const data = JSON.parse(body);
      const cidrs = [];
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string" && val[0].includes("/")) {
          cidrs.push(...val);
        }
      }
      return [...new Set(cidrs)];
    }
  },
  {
    name: "Oracle Cloud",
    slug: "oracle-cloud",
    description: "Oracle Cloud Infrastructure IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json"
      );
      const data = JSON.parse(body);
      const cidrs = [];
      for (const region of data.regions || []) {
        for (const cidr of region.cidrs || []) {
          if (cidr.cidr) cidrs.push(cidr.cidr);
        }
      }
      return cidrs;
    }
  },
  {
    name: "Fastly (Anycast Only)",
    slug: "fastly-anycast",
    description: "Fastly IPv4 anycast addresses only",
    async fetch() {
      const body = await httpGet("https://api.fastly.com/public-ip-list");
      const data = JSON.parse(body);
      return data.addresses || [];
    }
  },
  {
    name: "Imperva / Incapsula",
    slug: "imperva",
    description: "Imperva (Incapsula) WAF/CDN IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://my.incapsula.com/api/integration/v1/ips"
      );
      const data = JSON.parse(body);
      return [
        ...data.ipRanges || [],
        ...data.ipv6Ranges || []
      ];
    }
  },
  {
    name: "Bing Bot",
    slug: "bingbot",
    description: "Microsoft Bing crawler IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://www.bing.com/toolbox/bingbot.json"
      );
      const data = JSON.parse(body);
      return (data.prefixes || []).map(
        (p) => p.ipv4Prefix || p.ipv6Prefix
      ).filter(Boolean);
    }
  },
  {
    name: "Apple Private Relay",
    slug: "apple-relay",
    description: "Apple iCloud Private Relay egress IPs",
    async fetch() {
      const body = await httpGet(
        "https://mask-api.icloud.com/egress-ip-ranges.csv"
      );
      const cidrs = [];
      for (const line of body.split("\n")) {
        const parts = line.split(",");
        if (parts[0] && parts[0].includes("/")) {
          cidrs.push(parts[0].trim());
        }
      }
      return cidrs;
    }
  },
  {
    name: "Telegram",
    slug: "telegram",
    description: "Telegram Messenger server IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://core.telegram.org/resources/cidr.txt"
      );
      return body.split("\n").map((l) => l.trim()).filter((l) => l && l.includes("/"));
    }
  },
  {
    name: "Googlebot",
    slug: "googlebot",
    description: "Google web crawler IP ranges",
    async fetch() {
      const body = await httpGet(
        "https://developers.google.com/static/search/apis/ipranges/googlebot.json"
      );
      const data = JSON.parse(body);
      return (data.prefixes || []).map(
        (p) => p.ipv4Prefix || p.ipv6Prefix
      ).filter(Boolean);
    }
  },
  {
    name: "Google Special Crawlers",
    slug: "google-crawlers",
    description: "Google special-purpose crawler IPs (AdsBot, Feedfetcher, etc.)",
    async fetch() {
      const body = await httpGet(
        "https://developers.google.com/static/search/apis/ipranges/special-crawlers.json"
      );
      const data = JSON.parse(body);
      return (data.prefixes || []).map(
        (p) => p.ipv4Prefix || p.ipv6Prefix
      ).filter(Boolean);
    }
  },
  {
    name: "Google User-Triggered Fetchers",
    slug: "google-fetchers",
    description: "Google user-triggered fetcher IPs (Site Preview, etc.)",
    async fetch() {
      const body = await httpGet(
        "https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers.json"
      );
      const data = JSON.parse(body);
      return (data.prefixes || []).map(
        (p) => p.ipv4Prefix || p.ipv6Prefix
      ).filter(Boolean);
    }
  },
  {
    name: "JD Cloud (China)",
    slug: "jdcloud",
    description: "JD Cloud CDN (Chinese cloud provider)",
    async fetch() {
      const body = await httpGet(
        "https://www.cloudflare.com/ips-v4"
      );
      const cfCidrs = body.split("\n").map((l) => l.trim()).filter(Boolean);
      const body2 = await httpGet("https://api.github.com/meta", {
        Accept: "application/vnd.github.v3+json"
      });
      warn("JD Cloud does not publish a public IP range API.");
      warn("Consider using ASN lookup tools (e.g. bgp.he.net) for ASN AS37963.");
      return [];
    }
  }
];
function cidrToIPs(cidr) {
  if (cidr.includes(":")) return null;
  const parts = cidr.split("/");
  if (parts.length !== 2) return null;
  const ip = parts[0];
  const prefix = parseInt(parts[1], 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255))
    return null;
  const ipInt = (octets[0] << 24 | octets[1] << 16 | octets[2] << 8 | octets[3]) >>> 0;
  const mask = prefix === 0 ? 0 : ~0 << 32 - prefix >>> 0;
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  if (prefix === 32) {
    return [ip];
  }
  if (prefix === 31) {
    return [intToIP(network), intToIP(broadcast)];
  }
  const ips = [];
  for (let i = network + 1; i < broadcast; i++) {
    ips.push(intToIP(i >>> 0));
  }
  return ips;
}
function intToIP(n) {
  return `${n >>> 24 & 255}.${n >>> 16 & 255}.${n >>> 8 & 255}.${n & 255}`;
}
function countIPsInCIDR(cidr) {
  if (cidr.includes(":")) return 0;
  const parts = cidr.split("/");
  if (parts.length !== 2) return 0;
  const prefix = parseInt(parts[1], 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return 0;
  if (prefix === 32) return 1;
  if (prefix === 31) return 2;
  return Math.pow(2, 32 - prefix) - 2;
}
function formatNumber(n) {
  return n.toLocaleString("en-US");
}
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function ask(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve2) => {
    rl.question(`${C.white}  ${prompt}${C.r}`, (answer) => {
      rl.close();
      resolve2(answer.trim());
    });
  });
}
function printProviderList() {
  console.log();
  console.log(`${C.white}  Available CDN / Cloud Providers:${C.r}`);
  console.log();
  const col1 = [];
  const col2 = [];
  for (let i = 0; i < providers.length; i++) {
    if (i < Math.ceil(providers.length / 2)) {
      col1.push(providers[i]);
    } else {
      col2.push(providers[i]);
    }
  }
  for (let i = 0; i < col1.length; i++) {
    const num1 = String(i + 1).padStart(2);
    const left = `${C.cyan}  ${num1})${C.r} ${providers[i].name}`;
    const leftPad = 40;
    const leftLen = providers[i].name.length + 6;
    const padding = " ".repeat(Math.max(1, leftPad - leftLen));
    const j = i + col1.length;
    if (j < providers.length) {
      const num2 = String(j + 1).padStart(2);
      console.log(
        `${left}${padding}${C.cyan}${num2})${C.r} ${providers[j].name}`
      );
    } else {
      console.log(left);
    }
  }
  console.log();
  console.log(
    `${C.dim}   a) Fetch ALL providers    q) Quit${C.r}`
  );
  console.log();
}
async function fetchAndSave(provider) {
  info(`Fetching ${C.bold}${provider.name}${C.r} IP ranges...`);
  try {
    const cidrs = await provider.fetch();
    if (!cidrs || cidrs.length === 0) {
      warn(`No CIDR blocks returned for ${provider.name}.`);
      return null;
    }
    const unique = [...new Set(cidrs)];
    const v4 = unique.filter((c) => !c.includes(":"));
    const v6 = unique.filter((c) => c.includes(":"));
    success(`Found ${C.bold}${formatNumber(unique.length)}${C.r} CIDR blocks`);
    if (v4.length > 0) info(`IPv4 ranges: ${formatNumber(v4.length)}`);
    if (v6.length > 0) info(`IPv6 ranges: ${formatNumber(v6.length)}`);
    const outDir = path.resolve("cdn-ranges");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const cidrFile = path.join(outDir, `${provider.slug}.txt`);
    fs.writeFileSync(cidrFile, unique.join("\n") + "\n");
    const stat = fs.statSync(cidrFile);
    success(
      `Saved CIDRs to ${C.bold}cdn-ranges/${provider.slug}.txt${C.r} (${formatSize(stat.size)})`
    );
    let totalIPs = 0;
    for (const c of v4) {
      totalIPs += countIPsInCIDR(c);
    }
    if (totalIPs > 0) {
      info(`Total IPv4 addresses in ranges: ${C.bold}${formatNumber(totalIPs)}${C.r}`);
    }
    return unique;
  } catch (err) {
    error(`Failed to fetch ${provider.name}: ${err.message}`);
    return null;
  }
}
async function convertToIPs(provider, cidrs) {
  const v4 = cidrs.filter((c) => !c.includes(":"));
  const v6 = cidrs.filter((c) => c.includes(":"));
  let totalIPs = 0;
  for (const c of v4) {
    totalIPs += countIPsInCIDR(c);
  }
  if (totalIPs === 0) {
    warn("No IPv4 CIDRs to convert (IPv6 ranges are skipped - too large).");
    return;
  }
  info(`IPv4 addresses to generate: ${C.bold}${formatNumber(totalIPs)}${C.r}`);
  if (v6.length > 0) {
    info(`Skipping ${formatNumber(v6.length)} IPv6 ranges (address space too large).`);
  }
  if (totalIPs > 1e7) {
    warn(
      `This will create a ${C.bold}${formatNumber(totalIPs)}${C.r}-line file (~${formatSize(totalIPs * 16)}).`
    );
    const confirm = await ask("Continue? [y/N]: ");
    if (confirm.toLowerCase() !== "y") {
      info("Skipped IP conversion.");
      return;
    }
  }
  const outDir = path.resolve("cdn-ranges");
  const ipFile = path.join(outDir, `${provider.slug}_ips.txt`);
  const ws = fs.createWriteStream(ipFile);
  let written = 0;
  const startTime = Date.now();
  for (const cidr of v4) {
    const ips = cidrToIPs(cidr);
    if (!ips) continue;
    for (const ip of ips) {
      ws.write(ip + "\n");
      written++;
    }
    if (written % 1e5 === 0 && written > 0) {
      const elapsed2 = (Date.now() - startTime) / 1e3;
      const rate = Math.round(written / elapsed2);
      process.stdout.write(
        `\r${C.dim}  ... ${formatNumber(written)} / ${formatNumber(totalIPs)} IPs (${formatNumber(rate)}/sec)${C.r}`
      );
    }
  }
  await new Promise((resolve2) => ws.end(resolve2));
  if (written > 1e5) process.stdout.write("\r" + " ".repeat(70) + "\r");
  const stat = fs.statSync(ipFile);
  const elapsed = ((Date.now() - startTime) / 1e3).toFixed(1);
  success(
    `Saved ${C.bold}${formatNumber(written)}${C.r} IPs to ${C.bold}cdn-ranges/${provider.slug}_ips.txt${C.r} (${formatSize(stat.size)}) in ${elapsed}s`
  );
}
async function handleProvider(provider) {
  console.log();
  divider();
  console.log(
    `${C.white}  ${C.bold}${provider.name}${C.r} ${C.dim}- ${provider.description}${C.r}`
  );
  divider();
  const cidrs = await fetchAndSave(provider);
  if (!cidrs || cidrs.length === 0) return;
  console.log();
  const convert = await ask("Convert CIDRs to individual IPs? [y/N]: ");
  if (convert.toLowerCase() === "y") {
    await convertToIPs(provider, cidrs);
  }
  console.log();
  if (cidrs.length <= 30) {
    console.log(`${C.white}  CIDR Blocks:${C.r}`);
    for (const c of cidrs) {
      const count = countIPsInCIDR(c);
      const countStr = count > 0 ? ` ${C.dim}(${formatNumber(count)} IPs)${C.r}` : "";
      console.log(`${C.green}    ${c}${C.r}${countStr}`);
    }
  } else {
    console.log(`${C.white}  First 15 CIDR blocks:${C.r}`);
    for (const c of cidrs.slice(0, 15)) {
      const count = countIPsInCIDR(c);
      const countStr = count > 0 ? ` ${C.dim}(${formatNumber(count)} IPs)${C.r}` : "";
      console.log(`${C.green}    ${c}${C.r}${countStr}`);
    }
    console.log(
      `${C.dim}    ... and ${formatNumber(cidrs.length - 15)} more (see cdn-ranges/${provider.slug}.txt)${C.r}`
    );
  }
}
async function handleAll() {
  console.log();
  divider();
  console.log(`${C.white}  ${C.bold}Fetching ALL providers${C.r}`);
  divider();
  console.log();
  const convert = await ask(
    "Also convert CIDRs to IPs for each provider? [y/N]: "
  );
  const doConvert = convert.toLowerCase() === "y";
  console.log();
  let successCount = 0;
  let failCount = 0;
  for (const provider of providers) {
    info(`[${successCount + failCount + 1}/${providers.length}] ${provider.name}`);
    try {
      const cidrs = await fetchAndSave(provider);
      if (cidrs && cidrs.length > 0) {
        successCount++;
        if (doConvert) {
          await convertToIPs(provider, cidrs);
        }
      } else {
        failCount++;
      }
    } catch (err) {
      error(`${provider.name}: ${err.message}`);
      failCount++;
    }
    console.log();
  }
  divider();
  console.log(`${C.white}  ${C.bold}Summary${C.r}`);
  success(`Fetched: ${successCount} providers`);
  if (failCount > 0) error(`Failed: ${failCount} providers`);
  info(`Results saved to: ${C.bold}cdn-ranges/${C.r}`);
  divider();
}
async function searchProvider(query) {
  const q = query.toLowerCase().trim();
  const exact = providers.find(
    (p) => p.slug === q || p.name.toLowerCase() === q || p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === q.replace(/[^a-z0-9]/g, "")
  );
  if (exact) return exact;
  const partial = providers.filter(
    (p) => p.name.toLowerCase().includes(q) || p.slug.includes(q) || p.description.toLowerCase().includes(q)
  );
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    console.log();
    warn(`Multiple matches for "${query}":`);
    for (let i = 0; i < partial.length; i++) {
      console.log(
        `${C.cyan}    ${i + 1})${C.r} ${partial[i].name} ${C.dim}(${partial[i].slug})${C.r}`
      );
    }
    const pick = await ask("Choose [1-" + partial.length + "]: ");
    const idx = parseInt(pick, 10) - 1;
    if (idx >= 0 && idx < partial.length) return partial[idx];
    return null;
  }
  return null;
}
async function main() {
  printBanner();
  while (true) {
    printProviderList();
    const input = await ask("Enter provider number, name, or command: ");
    if (!input || input.toLowerCase() === "q" || input.toLowerCase() === "quit") {
      console.log();
      info("Goodbye!");
      console.log();
      break;
    }
    if (input.toLowerCase() === "a" || input.toLowerCase() === "all") {
      await handleAll();
      console.log();
      continue;
    }
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= providers.length) {
      await handleProvider(providers[num - 1]);
      console.log();
      continue;
    }
    const found = await searchProvider(input);
    if (found) {
      await handleProvider(found);
      console.log();
    } else {
      error(`Provider "${input}" not found. Try a number, name, or partial match.`);
      console.log();
    }
  }
}
main().catch((err) => {
  error(`Fatal: ${err.message}`);
  process.exit(1);
});
