# CDN Fetcher

A interactive command-line tool that fetches official IP ranges (CIDR blocks) from 20+ major CDN and cloud providers, with the ability to expand those ranges into individual IP addresses.

---

## Aim

The aim of CDN Fetcher is to give security engineers, network administrators, and researchers a single, reliable tool to pull live, authoritative IP range data directly from provider APIs — no stale third-party databases, no manual copying. Once fetched, ranges can be expanded into flat IP lists suitable for firewall rules, allowlists, blocklists, threat intelligence pipelines, or any tooling that works with plain IP addresses.

---

## Features

- Fetches CIDR blocks live from each provider's official public API or published source
- Supports 20+ providers including major CDNs, cloud platforms, crawlers, and messaging services
- Interactive menu — pick one provider, search by name, or fetch all at once
- Saves CIDR blocks to `cdn-ranges/<provider>.txt`
- Optionally expands IPv4 CIDR ranges into individual IP addresses, saved to `cdn-ranges/<provider>_ips.txt`
- Progress reporting with IP count estimates and file sizes
- IPv6 ranges are fetched and saved but skipped during IP expansion (address space is too large to enumerate)
- Large expansions (>10 million IPs) require explicit confirmation before writing

---

## Supported Providers

| # | Provider | Description |
|---|----------|-------------|
| 1 | Cloudflare | Global CDN, DDoS protection, DNS |
| 2 | CloudFront (AWS CDN) | Amazon Web Services CDN |
| 3 | AWS (All Services) | All Amazon Web Services IP ranges |
| 4 | AWS EC2 | Amazon EC2 compute IP ranges |
| 5 | AWS S3 | Amazon S3 storage IP ranges |
| 6 | Fastly | Edge cloud CDN platform |
| 7 | Google Cloud | Google Cloud Platform IP ranges |
| 8 | Google (All Services) | All Google services (Search, Gmail, YouTube, etc.) |
| 9 | Microsoft Azure | Microsoft Azure cloud IP ranges |
| 10 | GitHub | GitHub services (hooks, pages, actions, copilot, etc.) |
| 11 | Oracle Cloud | Oracle Cloud Infrastructure IP ranges |
| 12 | Fastly (Anycast Only) | Fastly IPv4 anycast addresses only |
| 13 | Imperva / Incapsula | Imperva WAF/CDN IP ranges |
| 14 | Bing Bot | Microsoft Bing crawler IP ranges |
| 15 | Apple Private Relay | Apple iCloud Private Relay egress IPs |
| 16 | Telegram | Telegram Messenger server IP ranges |
| 17 | Googlebot | Google web crawler IP ranges |
| 18 | Google Special Crawlers | AdsBot, Feedfetcher, and other special-purpose crawlers |
| 19 | Google User-Triggered Fetchers | Site Preview and other user-triggered fetcher IPs |
| 20 | JD Cloud (China) | JD Cloud CDN (note: no public API — ASN lookup recommended) |

---

## Requirements

- Node.js 18 or later
- No external npm dependencies — uses only Node.js built-in modules (`https`, `http`, `fs`, `path`, `readline`)

---

## Usage

Run the script directly:

```bash
node cdn.js
```

You will be presented with an interactive menu listing all providers. You can:

- Enter a **number** to select a specific provider
- Enter a **name or partial name** to search (e.g. `cloudflare`, `aws`, `google`)
- Enter `a` to fetch **all providers** at once
- Enter `q` to quit

### Example session

```
  Available CDN / Cloud Providers:

   1) Cloudflare                        11) Oracle Cloud
   2) CloudFront (AWS CDN)              12) Fastly (Anycast Only)
   3) AWS (All Services)                13) Imperva / Incapsula
   ...

  a) Fetch ALL providers    q) Quit

  Enter provider number, name, or command: 1

  ──────────────────────────────────────────────────
  Cloudflare - Global CDN, DDoS protection, DNS
  ──────────────────────────────────────────────────
  [*] Fetching Cloudflare IP ranges...
  [+] Found 15 CIDR blocks
  [*] IPv4 ranges: 13
  [*] IPv6 ranges: 2
  [+] Saved CIDRs to cdn-ranges/cloudflare.txt (196 B)
  [*] Total IPv4 addresses in ranges: 13,631,744

  Convert CIDRs to individual IPs? [y/N]: y
  [+] Saved 13,631,488 IPs to cdn-ranges/cloudflare_ips.txt (211.9 MB) in 8.3s
```

---

## Output

All output files are written to a `cdn-ranges/` directory created in your current working directory.

| File | Contents |
|------|----------|
| `cdn-ranges/<provider>.txt` | One CIDR block per line (IPv4 and IPv6) |
| `cdn-ranges/<provider>_ips.txt` | One IPv4 address per line (only created if you choose to expand) |

---

## Notes

- All IP data is fetched live at runtime from each provider's official source. No cached or bundled data is used.
- IPv6 ranges are included in the CIDR output files but are not expanded to individual IPs.
- JD Cloud does not publish a public IP range API. The tool will warn you and suggest using an ASN lookup tool (e.g. `bgp.he.net` for ASN AS37963).
- Requests include a standard browser `User-Agent` header and follow HTTP redirects automatically.
- Network timeouts are set to 15 seconds per request.
