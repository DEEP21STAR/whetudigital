# COMMANDS — Single Source of Truth

Generated: **2026-06-08 13:52** NZ · Re-run: `pwsh C:\Users\Admin\.claude\commands_regen.ps1`

Counts: **88** skills · **25** slash commands · **4** GURU dashboard ! commands · **115** HTTP routes · **5** CREW mission categories

## Table of Contents
- [Claude Code Skills](#claude-code-skills)
- [Claude Code Slash Commands](#claude-code-slash-commands)
- [AI GURU Dashboard ! Commands](#ai-guru-dashboard--commands)
- [AI GURU HTTP Routes](#ai-guru-http-routes)
- [CREW Mission Categories](#crew-mission-categories)
- [Cross-AI Quick Reference](#cross-ai-quick-reference)

---

## Claude Code Skills

Triggered with `/<name>` in Claude Code chat. Source: `~/.claude/skills/<name>/SKILL.md`

| Skill | What it does |
| --- | --- |
| `/ai-slop-cleaner` | Clean AI-generated code slop with a regression-safe, deletion-first workflow and optional reviewer-only mode |
| `/arcline` | ARCLINE — Whetū Digital NZ electrical PM tool. CoC/ESC/RoI generation, 7-year vault, EWRB-native. Launch Sept 2026. |
| `/ask` | Process-first advisor routing for Claude, Codex, or Gemini via 'omc ask', with artifact capture and no raw CLI assembly |
| `/autopilot` | Full autonomous execution from idea to working code |
| `/autoresearch` | Stateful single-mission improvement loop with strict evaluator contract, markdown decision logs, and max-runtime stop behavior |
| `/cancel` | Cancel any active OMC mode (autopilot, ralph, ultrawork, ultraqa, swarm, ultrapilot, pipeline, team) |
| `/ccg` | Claude-Codex-Gemini tri-model orchestration via /ask codex + /ask gemini, then Claude synthesizes results |
| `/ce-advanced-evaluation` | This skill should be used for advanced LLM evaluation: LLM-as-judge systems, direct scoring, pairwise comparison, rubric calibration, eva... |
| `/ce-bdi-mental-states` | This skill should be used when modeling agent mental states with BDI concepts: beliefs, desires, intentions, RDF-to-belief transformation... |
| `/ce-context-compression` | This skill should be used when long-running agent sessions need context compression, structured summarization, compaction, token-per-task... |
| `/ce-context-degradation` | This skill should be used for diagnosing and mitigating context degradation: lost-in-middle failures, context poisoning, context clash, c... |
| `/ce-context-fundamentals` | This skill should be used to explain or reason about the foundational concepts of context engineering: what context is, the anatomy of a ... |
| `/ce-context-optimization` | This skill should be used for improving context efficiency: context budgeting, observation masking, prefix or KV-cache strategy, partitio... |
| `/ce-evaluation` | This skill should be used when building agent evaluation systems: deterministic checks, regression suites, multi-dimensional rubrics, qua... |
| `/ce-filesystem-context` | This skill should be used when agent work needs file-backed context: durable scratchpads, tool-output offloading, just-in-time discovery,... |
| `/ce-harness-engineering` | This skill should be used when designing autonomous agent harnesses: research loops, evaluation scaffolds, locked and editable surfaces, ... |
| `/ce-hosted-agents` | This skill should be used when designing hosted or background agent infrastructure: sandboxed execution, remote coding environments, warm... |
| `/ce-latent-briefing` | This skill should be used when the user asks to "share memory between agents", "KV cache compaction for multi-agent", "orchestrator worke... |
| `/ce-memory-systems` | > |
| `/ce-multi-agent-patterns` | This skill should be used when designing multi-agent systems that need context isolation, supervisor or swarm coordination, explicit hand... |
| `/ce-project-development` | This skill should be used for project-level decisions about LLM-powered systems: whether an LLM is the right primitive for the task at ha... |
| `/ce-tool-design` | This skill should be used for the tool-interface layer of an agent system specifically: writing tool descriptions agents can route on, de... |
| `/ckm:banner-design` | Design banners for social media, ads, website heroes, creative assets, and print. Multiple art direction options with AI-generated visual... |
| `/ckm:brand` | Brand voice, visual identity, messaging frameworks, asset management, brand consistency. Activate for branded content, tone of voice, mar... |
| `/ckm:design` | Comprehensive design skill: brand identity, design tokens, UI styling, logo generation (55 styles, Gemini AI), corporate identity program... |
| `/ckm:design-system` | Token architecture, component specifications, and slide generation. Three-layer tokens (primitive→semantic→component), CSS variables, spa... |
| `/ckm:slides` | Create strategic HTML presentations with Chart.js, design tokens, responsive layouts, copywriting formulas, and contextual slide strategies. |
| `/ckm:ui-styling` | Create beautiful, accessible user interfaces with shadcn/ui components (built on Radix UI + Tailwind), Tailwind CSS utility-first styling... |
| `/clarity` | Clarity — Whetū Digital client dashboard. Setup, PIN gate, branding audit, config generation, deployment. |
| `/client-onboard` | Run interactive client onboarding for any Whetū Digital product. Asks setup questions, generates config JSON, and pastes it into localSto... |
| `/configure-notifications` | Configure notification integrations (Telegram, Discord, Slack) via natural language |
| `/deep-dive` | 2-stage pipeline: trace (causal investigation) -> deep-interview (requirements crystallization) with 3-point injection |
| `/deep-interview` | Socratic deep interview with mathematical ambiguity gating before explicit execution approval |
| `/deepinit` | Deep codebase initialization with hierarchical AGENTS.md documentation |
| `/deploy-to-vercel` | Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the l... |
| `/elevate` | Audits an HTML file against the Whetū Design Philosophy — gasp test, aurora 30%+, staggered entrances, colour ownership, motion hierarchy... |
| `/external-context` | Invoke parallel document-specialist agents for external web searches and documentation lookup |
| `/graphify-windows` | any input (code, docs, papers, images) → knowledge graph → clustered communities → HTML + JSON + audit report |
| `/health-check` | Runs the SUPER NOVA monitor checks on demand — server health, mission queue status, heartbeat freshness, listening ports, recent failures... |
| `/hud` | Configure HUD display options (layout, presets, display elements) |
| `/learner` | Extract a learned skill from the current conversation |
| `/marketing` | AI GURU Marketing Mode. Use when the user types "/marketing" or asks for a full marketing kit for a Whetū Digital product. Chains the 5 W... |
| `/mcp-setup` | Configure popular MCP servers for enhanced agent capabilities |
| `/mission` | Interactive AI GURU CREW mission builder. Asks for project + brief, then auto-formats and submits with the SUPER NOVA structured report-b... |
| `/notebooklm` | Use this skill to query your Google NotebookLM notebooks directly from Claude Code for source-grounded, citation-backed answers from Gemi... |
| `/omc-doctor` | Diagnose and fix oh-my-claudecode installation issues |
| `/omc-plan` | Strategic planning with optional interview workflow |
| `/omc-reference` | OMC agent catalog, available tools, team pipeline routing, commit protocol, and skills registry. Auto-loads when delegating to agents, us... |
| `/omc-setup` | Install or refresh oh-my-claudecode for plugin, npm, and local-dev setups from the canonical setup flow |
| `/omc-teams` | CLI-team runtime for claude, codex, or gemini workers in tmux panes when you need process-based parallel execution |
| `/postmortem` | Produces a written postmortem for any AI GURU CREW mission by id — pulls the structured result, audit log transitions, files written, fac... |
| `/project-session-manager` | Worktree-first dev environment manager for issues, PRs, and features with optional tmux sessions |
| `/prompt` | Saved prompt-template library. Lists templates or pastes a chosen one into your input. Trigger with /prompt or /prompt <template-name>. |
| `/ralph` | Self-referential loop until task completion with configurable verification reviewer |
| `/ralplan` | Consensus planning entrypoint that auto-gates vague ralph/autopilot/team requests before execution |
| `/release` | Generic release assistant — analyzes repo release rules, caches them in .omc/RELEASE_RULE.md, then guides the release |
| `/route` | Route any task to the optimal AI tool (Claude Code / AI GURU / Gemini / Artifacts) to eliminate usage waste without sacrificing quality |
| `/sciomc` | Orchestrate parallel scientist agents for comprehensive analysis with AUTO mode |
| `/self-improve` | Autonomous evolutionary code improvement engine with tournament selection |
| `/setup` | Use first for install/update routing — sends setup, doctor, or MCP requests to the correct OMC setup flow |
| `/skill` | Manage local skills - list, add, remove, search, edit, setup wizard |
| `/skill-auto-discovery` | Extracts AI tips/commands/patterns from images or text and auto-creates draft skill files for approval |
| `/skillify` | Turn a repeatable workflow from the current session into a reusable OMC skill draft |
| `/stlrentals-code-review` | Code review checklist for STLRentals (stlrentals.py) — secrets, NZ dates, edge cases, Tkinter rules |
| `/stlrentals-refactor` | Refactor protocol for stlrentals.py — surgical edits, py_compile, Tkinter rules, never rename methods |
| `/stlrentals-release` | Release checklist for STLRentals — compile, version bump, backup, git commit |
| `/team` | N coordinated agents on shared task list using Claude Code native teams |
| `/trace` | Evidence-driven tracing lane that orchestrates competing tracer hypotheses in Claude built-in team mode |
| `/ui-ux-pro-max` | UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guideli... |
| `/ultragoal` | Durable multi-goal workflow that persists plan/ledger artifacts under .omc/ultragoal and prints Claude /goal handoff text for the active ... |
| `/ultraqa` | QA cycling workflow - test, verify, fix, repeat until goal met |
| `/ultrawork` | Parallel execution engine for high-throughput task completion |
| `/vercel-cli-with-tokens` | Deploy and manage projects on Vercel using token-based authentication. Use when working with Vercel CLI using access tokens rather than i... |
| `/vercel-composition-patterns` | React composition patterns that scale. Use when refactoring components with |
| `/vercel-react-best-practices` | React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refa... |
| `/vercel-react-native-skills` | React Native and Expo best practices for building performant mobile apps. Use |
| `/vercel-react-view-transitions` | Guide for implementing smooth, native-feeling animations using React's View Transition API ('<ViewTransition>' component, 'addTransitionT... |
| `/visual-verdict` | Structured visual QA verdict for screenshot-to-reference comparisons |
| `/web-design-guidelines` | Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review ... |
| `/whetu-digital` | Whetū Digital brand auditor, footer generator, product deployer, and status tracker |
| `/whetu-marketing-email` | When the user wants to create or optimize an email sequence, drip campaign, automated email flow, or lifecycle email program. Also use wh... |
| `/whetu-marketing-landing` | When the user wants to optimize, improve, or increase conversions on any marketing page — including homepage, landing pages, pricing page... |
| `/whetu-marketing-pricing` | When the user wants help with pricing decisions, packaging, or monetization strategy. Also use when the user mentions 'pricing,' 'pricing... |
| `/whetu-marketing-referral` | When the user wants to create, optimize, or analyze a referral program, affiliate program, or word-of-mouth strategy. Also use when the u... |
| `/whetu-marketing-seo` | When the user wants to create SEO-driven pages at scale using templates and data. Also use when the user mentions "programmatic SEO," "te... |
| `/wiki` | LLM Wiki — persistent markdown knowledge base that compounds across sessions (Karpathy model) |
| `/wizard-builder` | Scaffold a new Whetū Digital Dashboard Wizard from the standard template — 3-step setup, PIN gate, localStorage config, Whetū footer. Tri... |
| `/writer-memory` | Agentic memory system for writers - track characters, relationships, scenes, and themes |

---

## Claude Code Slash Commands

Source: `~/.claude/commands/<name>.md`

| Command | What it does |
| --- | --- |
| `/add-feature` | Add a new feature to stlrentals.py without breaking existing code. |
| `/audit` | Read-only risk analysis before making any big change. |
| `/clarity` | Load Clarity budget app context and prepare for Clarity work. |
| `/compact-stl` | Smart context compact — preserves STL-specific knowledge. |
| `/context-prime` | Load Deep's full PHOENIX memory and prime the session. Run this at the start of every conversation. |
| `/daily` | Start each STL Rentals session with a safety check. |
| `/email-cold` | Generate cold email sequences for Whetū Digital products. Sharp, human, NZ-grounded. |
| `/fix` | Safely fix a specific bug in stlrentals.py. |
| `/guru` | Load AI GURU context and check system health. |
| `/handoff` | Write a context document so a fresh session picks up exactly here. |
| `/launch` | Generate a complete launch sequence for a Whetū Digital product. |
| `/lead-magnets` | Generate lead magnet ideas, content outlines, and distribution plans for Whetū Digital products. |
| `/map` | Show current line number map of stlrentals.py. |
| `/objections` | Generate sharp, human responses to the most common objections for a Whetū Digital product. |
| `/phoenix` | Load PHOENIX project context and prepare for PHOENIX work. |
| `/pricing` | Generate complete pricing page copy for a Whetū Digital product. |
| `/referral` | Generate referral program structure, partner strategy, and copy for Whetū Digital products. |
| `/section` | Read and summarise a specific section of stlrentals.py. |
| `/session-save` | Review this conversation and save a session log to memory. |
| `/stlrentals` | Load STLRentals / Property Tracker NZ context. |
| `/value` | '/value' · 🔵 Analysis · v1.1 · 2026-04-16 |
| `/verify` | Run full safety checks after any edit session. |
| `/voyager` | Load VOYAGER trip dashboard context. |
| `/whetu` | Load Whetū Digital business context. |
| `/whetu-brief` | Full Whetū Digital context load. Run this at the start of any Whetū session. |

---

## AI GURU Dashboard ! Commands

Typed in the AI GURU terminal dashboard. Source: `C:\PHOENIX\AI_GURU\guru_dashboard.py`

| Command | What it does |
| --- | --- |
| `!agents` | list active agents |
| `!help` | full command list |
| `!review` | trigger CREW review |
| `!web` | web search via Tavily |

---

## AI GURU HTTP Routes

Server: `http://localhost:8888` · Source: `C:\PHOENIX\AI_GURU\guru_webui.py`

| Method | Path |
| --- | --- |
| ? | `/api/admin-cmds` |
| ? | `/api/admin-cmds/done` |
| ? | `/api/arcane-evaluate` |
| ? | `/api/arcane-status` |
| ? | `/api/ask` |
| ? | `/api/ask-stream` |
| ? | `/api/audit-feed` |
| ? | `/api/automations` |
| ? | `/api/backup/run` |
| ? | `/api/backup/status` |
| ? | `/api/benchmark` |
| ? | `/api/benchmark-local` |
| ? | `/api/board` |
| ? | `/api/board/complete` |
| ? | `/api/brain/search` |
| ? | `/api/business` |
| ? | `/api/can-restart` |
| ? | `/api/cascade-health` |
| ? | `/api/check` |
| ? | `/api/commands` |
| ? | `/api/computer` |
| ? | `/api/computer/status` |
| ? | `/api/config` |
| ? | `/api/constitution` |
| ? | `/api/constitution-update` |
| ? | `/api/council` |
| ? | `/api/crew` |
| ? | `/api/crew-ask` |
| ? | `/api/crew-live` |
| ? | `/api/crew-log` |
| ? | `/api/crew-status` |
| ? | `/api/current-model` |
| ? | `/api/esng-status` |
| ? | `/api/evolve-constitution` |
| ? | `/api/failures` |
| ? | `/api/feeds` |
| ? | `/api/graceful-restart` |
| ? | `/api/handoff-preview` |
| ? | `/api/heal` |
| ? | `/api/health` |
| ? | `/api/heartbeat` |
| ? | `/api/imagine` |
| ? | `/api/interview-questions` |
| ? | `/api/iter-align` |
| ? | `/api/log` |
| ? | `/api/machines` |
| ? | `/api/memory/count` |
| ? | `/api/memory/recall` |
| ? | `/api/memory/store` |
| ? | `/api/metrics` |
| ? | `/api/mission` |
| ? | `/api/mission-board` |
| ? | `/api/mission-list` |
| ? | `/api/mission/delete` |
| ? | `/api/mission/submit` |
| ? | `/api/mission/update` |
| ? | `/api/mission/worker-status` |
| ? | `/api/model-scout/report` |
| ? | `/api/model-scout/run` |
| ? | `/api/models` |
| ? | `/api/morning-brief` |
| ? | `/api/net-ping` |
| ? | `/api/nexus-search` |
| ? | `/api/notify` |
| ? | `/api/nova-commands` |
| ? | `/api/nova-commands/delete` |
| ? | `/api/nova-commands/save` |
| ? | `/api/nova-god` |
| ? | `/api/nova-qa` |
| ? | `/api/nova-stack` |
| ? | `/api/ollama-live` |
| ? | `/api/open-file` |
| ? | `/api/open-path` |
| ? | `/api/openrouter-credits` |
| ? | `/api/os-guide` |
| ? | `/api/predicates` |
| ? | `/api/provider-health` |
| ? | `/api/provider-stats` |
| ? | `/api/provider-vitals` |
| ? | `/api/ps-run` |
| ? | `/api/queue-task` |
| ? | `/api/rag-status` |
| ? | `/api/rate-status` |
| ? | `/api/restart-service` |
| ? | `/api/route` |
| ? | `/api/run` |
| ? | `/api/run-cmd` |
| ? | `/api/run-step` |
| ? | `/api/save-interview` |
| ? | `/api/save-template` |
| ? | `/api/self-qc` |
| ? | `/api/self-test` |
| ? | `/api/service` |
| ? | `/api/sessions` |
| ? | `/api/skills` |
| ? | `/api/sleep-engine` |
| ? | `/api/smart-route` |
| ? | `/api/status` |
| ? | `/api/switch-model` |
| ? | `/api/task-events` |
| ? | `/api/task-update` |
| ? | `/api/tasks` |
| ? | `/api/templates` |
| ? | `/api/tournament` |
| ? | `/api/vault` |
| ? | `/api/vault-files` |
| ? | `/api/vault-read` |
| ? | `/api/vault-search` |
| ? | `/api/vault-write` |
| ? | `/api/verify-claim` |
| ? | `/api/vision` |
| ? | `/api/voice/speak` |
| ? | `/api/web-search` |
| ? | `/api/zenith/ssh` |
| ? | `/api/zenith/status` |

---

## CREW Mission Categories

Submit via `POST http://localhost:8888/api/mission/submit` with `category` field.

| Category | Notes |
| --- | --- |
| `document` | Docs, READMEs, writeups |
| `install` | Package/tool installation |
| `memory` | Memory writes/updates |
| `quick` | Fast single-step tasks |
| `research` | Information gathering, no code changes |

---

## Cross-AI Quick Reference

When you don't know which tool to use:

| You want to... | Use |
| --- | --- |
| Send one request to Claude OR Codex OR Gemini | `/ask claude <prompt>` (or codex, gemini) |
| Get all three in parallel + synthesis | `/ccg <prompt>` |
| Auto-route a task to the cheapest capable tool | `/route <task>` |
| Spin up a CREW mission (multi-step work) | `/mission <brief>` |
| Plan before building | `/omc-plan` or `/ralplan` |
| Run a recurring task on cron | `/schedule` or `/loop` |
| Save current state for next session | `/handoff` or `/session-save` |
| Resume after reinstall | session start auto-loads `CONTEXT_NOW.md` |

---

_This file is auto-generated. To refresh: `pwsh C:\Users\Admin\.claude\commands_regen.ps1`_
_Hardlinked across project roots so any AI (Claude/Codex/Gemini) reading from a project dir sees the same catalog._
