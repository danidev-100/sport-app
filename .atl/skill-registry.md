# Skill Registry — Sport

**Generated**: 2026-05-10
**Source**: SDD Init scan
**Note**: SDD skills (`sdd-*`), `_shared`, and `skill-registry` are excluded per registry rules.

## Project-Level Skills

### frontend-design
- **Trigger**: Building web components, pages, artifacts, posters, applications, HTML/CSS layouts, styling UI
- **Path**: `.agents/skills/frontend-design/SKILL.md`
- **Description**: Create distinctive, production-grade frontend interfaces with high design quality, avoiding generic AI aesthetics.

### shadcn
- **Trigger**: shadcn components, component registries, presets, projects with `components.json`, "shadcn init"
- **Path**: `.agents/skills/shadcn/SKILL.md`
- **Description**: Manages shadcn components and projects — adding, searching, fixing, debugging, styling, composing UI.

### vercel-react-best-practices
- **Trigger**: Writing, reviewing, or refactoring React/Next.js code for performance optimization
- **Path**: `.agents/skills/vercel-react-best-practices/SKILL.md`
- **Description**: React and Next.js performance optimization guidelines from Vercel Engineering (70 rules across 8 categories).

## User-Level Skills (OpenCode)

### branch-pr
- **Trigger**: Creating, opening, or preparing PRs for review
- **Path**: `~/.config/opencode/skills/branch-pr/SKILL.md`

### chained-pr
- **Trigger**: PRs over 400 lines, stacked PRs, review slices
- **Path**: `~/.config/opencode/skills/chained-pr/SKILL.md`

### cognitive-doc-design
- **Trigger**: Writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs
- **Path**: `~/.config/opencode/skills/cognitive-doc-design/SKILL.md`

### comment-writer
- **Trigger**: PR feedback, issue replies, reviews, Slack messages, GitHub comments
- **Path**: `~/.config/opencode/skills/comment-writer/SKILL.md`

### find-skills
- **Trigger**: User asks "how do I do X", "find a skill for X", "is there a skill that can..."
- **Path**: `~/.agents/skills/find-skills/SKILL.md`

### go-testing
- **Trigger**: Go tests, go test coverage, Bubbletea teatest, golden files
- **Path**: `~/.config/opencode/skills/go-testing/SKILL.md`

### issue-creation
- **Trigger**: Creating GitHub issues, bug reports, or feature requests
- **Path**: `~/.config/opencode/skills/issue-creation/SKILL.md`

### judgment-day
- **Trigger**: Judgment day, dual review, adversarial review, juzgar
- **Path**: `~/.config/opencode/skills/judgment-day/SKILL.md`

### skill-creator
- **Trigger**: New skills, agent instructions, documenting AI usage patterns
- **Path**: `~/.config/opencode/skills/skill-creator/SKILL.md`

### work-unit-commits
- **Trigger**: Implementation, commit splitting, chained PRs, keeping tests and docs with code
- **Path**: `~/.config/opencode/skills/work-unit-commits/SKILL.md`

## Convention Files

### AGENTS.md (root)
- **Path**: `./AGENTS.md`
- **Content**: Repository-specific quick facts, port/config info, common pitfalls for agents
- **Referenced files**: `SPEC.md`, `backend/src/server.js`, `frontend/src/main.jsx`, `frontend/vite.config.js`, `frontend/src/api/apiClient.js`, `backend/prisma/schema.prisma`

### SPEC.md (root)
- **Path**: `./SPEC.md`
- **Content**: Canonical API spec (endpoints, models), folder structure, design decisions
