# Changelog

What changed for the people using UIcockpit. Two clocks run here, because four
artifacts ship in two different ways:

**The product clock — dated, and that is this file.** The site, the audit and the
kit are continuously deployed. There is nothing to install, so a version number
would say nothing. **A release is anything that changes what someone can do.** A
refactor is not a release, however large; a one-line fix that changes the answer
we give about your codebase is.

**The package clock — semver.** `uicockpit` (CLI) and `uicockpit-mcp` are
installed artifacts. They get a version, a git tag (`cli-v0.7.0`) and a GitHub
release cut from the entry below. **A release is a publish.** The version each
one carries is named wherever it is shown; there is no single "UIcockpit
version", because there is no single thing to version.

**Kits are not versioned at all.** A kit lives at `/k/<hash>.css`, and the hash
IS the version — permanent, immutable and specific to that kit. Nothing to bump,
nothing to migrate, no way for a link to change under you.

Dates are the day the change went live. Newest first.

---

## 2026-08-14

### Added

- **The audit reads a zipped project.** Picking a folder is a desktop-only
  ability — `webkitdirectory` does nothing on iOS or Android — so a phone had no
  way in at all. A `.zip` is the one shape a phone can hand over, and it is what
  GitHub's own "Download ZIP" produces. Read entirely in your tab, like
  everything else here.
- **Both entrances are reachable on a phone.** The nav used to drop whichever
  button fitted worst as the screen narrowed, and below 420px that was "Audit my
  UI" — so on a phone the audit door could only be reached by typing the URL.

### Changed

- **The audit derives your page, ink and brand from what your code DECLARES,
  not from what it happens to use most.** Frequency picks the muted grey in any
  well-built app, because every card carries one heading and three secondary
  lines. Concretely: n8n was reported as a dark app and is light, documenso's
  body text came back a near-black green, and two products with unrelated brands
  were handed the same indigo.
- **Large repositories are read design-system first.** The file budget used to
  be spent in directory order, which on a monorepo meant it could run out before
  reaching the frontend at all — and the audit would still answer confidently,
  describing a backend as an app.
- **A folder and a zip of that folder now give the same answer.** They did not:
  the same 2,073 files in a different order produced two different brands.

### Removed

- **`/styles`.** Starting from a named preset was a third entrance beside the
  two real ones, and it sold the part of a design system that should be yours.
  The Style presets themselves are untouched inside the configurator.

---

## 2026-08-12

### Added

- **`audit` — point UIcockpit at a codebase you have already written.** Until
  now this only helped at the start of a project, which excludes everyone with
  forty screens already built. The audit derives the design system your code
  already implies and shows you the distance between the two. It returns a
  configuration, not a grade.
- **Your code never leaves your machine.** The scan runs in the tab. The only
  request is us handing you the kit vocabulary; nothing travels the other way,
  and you can watch the network panel stay quiet.
- **It refuses rather than guess.** Below 70% of your styling readable, no score
  is published — you get what was found and an explanation, not a number over
  code we could not read.
