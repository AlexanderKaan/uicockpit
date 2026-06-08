# Security Policy

## Supported versions

UIcockpit is a continuously deployed single-page app — the latest version at
[uicockpit.com](https://uicockpit.com) (and the kit served from
`kit.uicockpit.com`) is the only supported version. There are no long-lived
releases to back-port fixes to.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue for a
vulnerability.

- Preferred: use GitHub's **private vulnerability reporting**
  (the repo's *Security → Report a vulnerability* tab). This keeps the report
  confidential and lets us coordinate a fix.

When reporting, please include:

- a description of the issue and its impact,
- steps to reproduce (a minimal proof-of-concept if possible),
- the affected URL / surface (the app, an export, or the CDN).

## Scope

UIcockpit runs entirely in the browser, stores no accounts, and persists state
only in the URL hash and `localStorage`. Things especially worth reporting:

- XSS or HTML/CSS injection via a shared kit hash or an uploaded custom font,
- a way to make the CDN Worker (`kit.uicockpit.com`) serve attacker-controlled
  content for someone else's kit URL,
- supply-chain or dependency issues affecting the build/export output.

## What to expect

We aim to acknowledge a report within a few business days and to ship a fix
promptly once confirmed. Thank you for helping keep UIcockpit and its users safe.
