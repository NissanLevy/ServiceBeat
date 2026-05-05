# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report them privately by emailing **nissan.webdeveloper@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You will receive a response within 48 hours. Once the issue is confirmed and a fix is released, you are welcome to disclose it publicly.

## Scope

Issues of interest include but are not limited to:

- Authentication or authorisation bypasses
- API token leakage or forgery
- SQL injection or data exposure via Prisma queries
- XSS in monitor names, URLs, or assertion values
- Secrets exposed in logs or API responses

## Out of scope

- Attacks requiring physical access to the server
- Denial of service against a self-hosted instance
- Issues in dependencies — report those upstream
- Missing security headers on the default local dev setup
