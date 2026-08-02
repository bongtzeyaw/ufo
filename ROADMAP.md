# Strawmaps

Early-stage ideas for where this project could go. Each entry is a strawman —
written down to be challenged, refined, or promoted into GitHub issues, not a
commitment. Statuses: **idea** (unvalidated) → **exploring** (spiking
feasibility) → **planned** (tracked in issues).

## North star

This project exists to be a **reference resource**: the definitive free map of
UAP media that governments have officially shown the public. When aims
conflict, accuracy, coverage and neutrality win. Scope discipline: official
government releases only, videos and images only.

## Project One World — more sources, less manual work

**Status:** idea · **Depends on:** nothing

- **Automate the U.S. data refresh**, so new PURSUE releases appear on the map
  without manual work, and problems (new location vocabulary, upstream format
  changes) surface loudly instead of silently dropping records.
- **Expand to data released officially by other countries.**
  - Existence of database and IP rule should be investigated per country.
  - Aim: the map should read as "what governments have shown the public", not
    "what the U.S. has shown" — which means a source-agnostic record model and
    a visible source dimension in the UI.

## Project UFO Community — reader utilities

**Status:** idea (re-scoped 2026-08-02) · **Depends on:** nothing

Trimmed to features that serve reference use, in line with the north star:

- watched/unwatched markers and favourites/custom tags, kept on the reader's
  own device — no account needed;
- shareable links to individual records;
- a feed to follow new releases;
- multilingual support (French, Chinese and Japanese are natural first
  targets).

**Dropped from the aims:** the sign-up/login flow and the forum. They serve a
community-hub north star rather than a reference resource, and they carry the
project's biggest architectural break (a backend) plus moderation and privacy
burdens. Revisit only if a real community forms around the site.

## Project Okane Kasegu — monetization

**Status:** idea · **Depends on:** traffic (which the other projects build)

Kept in full, with eyes open: ads and paywalls sit in tension with the
reference-resource identity (neutrality and trust are part of being
definitive), and the underlying data is public domain, so the product is the
curation and UX. Priorities to be revisited when there is real traffic.

Candidate levers, roughly in order of effort:

- **Donations:** GitHub Sponsors / Ko-fi — zero infrastructure.
- **Feature requests with paid priority:** a public suggestion board where
  Patreon supporters' requests rank higher.
- **Affiliate marketing.**
- **Merch** (Amazon Merch on Demand etc.).
- **Ads** and **subscription-gated extra features:** both likely require
  leaving GitHub Pages (its terms restrict commercial use), and subscriptions
  would reopen the accounts question dropped from UFO Community. DVIDS /
  war.gov embed terms should be checked before placing ads next to their
  media.

## Project Discoverability — be findable and citable

**Status:** idea (added 2026-08-02) · **Depends on:** nothing

A reference resource is only definitive if people find it and link to it:

- SEO basics and per-record social share previews, so individual records can
  be cited and unfurl nicely when shared;
- submission to relevant directories and communities;
- the aim: when a new release makes the news, this site is the link people
  paste.
