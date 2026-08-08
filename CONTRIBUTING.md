# Contributing

Contributions are welcome for application code, tests, workshop content, documentation, and accessibility improvements.

## Before You Start

- Read [README.md](README.md) and the [documentation index](docs/README.md).
- Search existing issues before opening a new one.
- For a substantial content or architecture change, open an issue first so the learning objective and modeling implications can be discussed.

## Development Setup

```bash
npm ci
npm run dev
```

The project requires Node.js 22.13 or newer.

## Contribution Rules

- Keep changes scoped and explain the user-facing problem they solve.
- Preserve metric conservation, physical floors, business invariants, and authored option outcomes.
- Add or update tests for behavior and content changes.
- Keep keyboard, screen-reader, reduced-motion, and responsive behavior intact.
- Update public documentation when behavior or contributor contracts change.
- Do not commit credentials, local state, generated output, or personal workshop data.

## Quality Gate

Run before opening a pull request:

```bash
npm run check
```

## Pull Requests

A pull request should include:

- the problem and intended outcome
- the chosen approach and important trade-offs
- test and visual verification performed
- any change to workshop semantics, scoring, persistence, or authored data

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
