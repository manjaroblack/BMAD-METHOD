# BMAD Agents Quick Reference Guide

This guide provides a quick overview of all available agents in the BMAD-METHOD framework, their roles, key commands, and when to use them.

## 🎭 BMad Orchestrator

**Agent ID:** `bmad-orchestrator`\
**Name:** BMad Orchestrator\
**Icon:** 🎭

**When to Use:** Workflow coordination, multi-agent tasks, role switching guidance, and when unsure which specialist to consult

**Key Commands:**

- `*help` - Show available agents and workflows
- `*agent [name]` - Transform into specialized agent
- `*workflow [name]` - Start specific workflow
- `*workflow-guidance` - Get personalized workflow selection help
- `*kb-mode` - Load full BMad knowledge base
- `*status` - Show current context and progress
- `*party-mode` - Group chat with all agents

---

## 🧙 BMad Master

**Agent ID:** `bmad-master`\
**Name:** BMad Master\
**Icon:** 🧙

**When to Use:** Comprehensive expertise across all domains, running one-off tasks without persona transformation, or using the same agent for multiple things

**Key Commands:**

- `*help` - Show available commands
- `*kb` - Toggle knowledge base mode
- `*task {task}` - Execute specific task
- `*create-doc {template}` - Create document with template
- `*execute-checklist {checklist}` - Run checklist
- `*shard-doc {document} {destination}` - Split document into parts
- `*document-project` - Document existing project

---

## 📊 Business Analyst (Mary)

**Agent ID:** `analyst`\
**Name:** Mary\
**Icon:** 📊

**When to Use:** Market research, brainstorming, competitive analysis, creating project briefs, initial project discovery, and documenting existing projects (brownfield)

**Key Commands:**

- `*help` - Show available commands
- `*create-project-brief` - Create project brief document
- `*perform-market-research` - Create market research document
- `*create-competitor-analysis` - Create competitor analysis
- `*brainstorm {topic}` - Facilitate structured brainstorming session
- `*research-prompt {topic}` - Create deep research prompt
- `*elicit` - Run advanced elicitation techniques

---

## 🏗️ Architect (Winston)

**Agent ID:** `architect`\
**Name:** Winston\
**Icon:** 🏗️

**When to Use:** System design, architecture documents, technology selection, API design, and infrastructure planning

**Key Commands:**

- `*help` - Show available commands
- `*create-full-stack-architecture` - Create complete system architecture
- `*create-backend-architecture` - Create backend architecture
- `*create-front-end-architecture` - Create frontend architecture
- `*create-brownfield-architecture` - Create architecture for existing projects
- `*document-project` - Document existing project architecture
- `*execute-checklist {checklist}` - Run architecture checklist
- `*shard-prd` - Split PRD into architecture components

---

## 📋 Product Manager (John)

**Agent ID:** `pm`\
**Name:** John\
**Icon:** 📋

**When to Use:** Creating PRDs, product strategy, feature prioritization, roadmap planning, and stakeholder communication

**Key Commands:**

- `*help` - Show available commands
- `*create-prd` - Create Product Requirements Document
- `*create-brownfield-prd` - Create PRD for existing projects
- `*create-brownfield-epic` - Create epic for brownfield projects
- `*create-brownfield-story` - Create user story from requirements
- `*shard-prd` - Split PRD into manageable parts
- `*correct-course` - Execute course correction task

---

## 📝 Product Owner (Sarah)

**Agent ID:** `po`\
**Name:** Sarah\
**Icon:** 📝

**When to Use:** Backlog management, story refinement, acceptance criteria, sprint planning, and prioritization decisions

**Key Commands:**

- `*help` - Show available commands
- `*execute-checklist-po` - Run Product Owner master checklist
- `*create-epic` - Create epic for brownfield projects
- `*create-story` - Create user story from requirements
- `*validate-story-draft {story}` - Validate story draft
- `*shard-doc {document} {destination}` - Split document
- `*correct-course` - Execute course correction

---

## 🏃 Scrum Master (Bob)

**Agent ID:** `sm`\
**Name:** Bob\
**Icon:** 🏃

**When to Use:** Story creation, epic management, retrospectives in party-mode, and agile process guidance

**Key Commands:**

- `*help` - Show available commands
- `*draft` - Execute create-next-story task
- `*story-checklist` - Execute story draft checklist
- `*correct-course` - Execute course correction

---

## 💻 Full Stack Developer (James)

**Agent ID:** `dev`\
**Name:** James\
**Icon:** 💻

**When to Use:** Code implementation, debugging, refactoring, and development best practices

**Key Commands:**

- `*help` - Show available commands
- `*run-tests` - Execute linting and tests
- `*explain` - Detailed explanation of recent work for learning

**Special Workflow:**

- Follows `develop-story` command when implementing stories
- Only updates specific story file sections (Dev Agent Record, checkboxes, etc.)
- Executes tasks sequentially with comprehensive testing

---

## 🧪 Senior Developer & QA (Quinn)

**Agent ID:** `qa`\
**Name:** Quinn\
**Icon:** 🧪

**When to Use:** Senior code review, refactoring, test planning, quality assurance, and mentoring through code improvements

**Key Commands:**

- `*help` - Show available commands
- `*review {story}` - Execute story review task

**Special Focus:**

- Only updates "QA Results" section of story files
- Provides senior-level code review and mentorship
- Focuses on test strategy and architecture

---

## 🎨 UX Expert (Sally)

**Agent ID:** `ux-expert`\
**Name:** Sally\
**Icon:** 🎨

**When to Use:** UI/UX design, wireframes, prototypes, front-end specifications, and user experience optimization

**Key Commands:**

- `*help` - Show available commands
- `*create-front-end-spec` - Create frontend specification document
- `*generate-ui-prompt` - Generate AI UI generation prompts

---

## 🚀 Quick Start Tips

1. **All commands require `*` prefix** (e.g., `*help`, `*agent pm`)
2. **Start with BMad Orchestrator** if unsure which agent to use
3. **Use numbered lists** - agents present options as numbered lists for easy selection
4. **Commands are context-aware** - agents understand flexible requests
5. **Each agent has specialized templates and tasks** - switch agents to access their capabilities
6. **Use `*exit` to leave any agent** and return to normal mode

## 📁 File Structure Reference

```
.bmad-core/agents/ (installed from src/core/agents/)
├── analyst.md          # 📊 Business Analyst (Mary)
├── architect.md        # 🏗️ Architect (Winston)
├── bmad-master.md      # 🧙 BMad Master
├── bmad-orchestrator.md # 🎭 BMad Orchestrator
├── dev.md              # 💻 Full Stack Developer (James)
├── pm.md               # 📋 Product Manager (John)
├── po.md               # 📝 Product Owner (Sarah)
├── qa.md               # 🧪 Senior Developer & QA (Quinn)
├── sm.md               # 🏃 Scrum Master (Bob)
└── ux-expert.md        # 🎨 UX Expert (Sally)
```

---

_This reference guide covers the core BMAD-METHOD agents. Each agent has additional capabilities and dependencies - use `*help` within any agent for detailed command lists._
