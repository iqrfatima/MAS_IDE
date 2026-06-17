# Multi-Agent Software Development System (MAS)

## Overview

A Multi-Agent System (MAS) is an AI architecture where multiple autonomous agents collaborate, communicate, and coordinate to solve complex software engineering tasks that would be difficult for a single agent to handle efficiently.

Each agent is assigned a specialized role such as planning, architecture design, frontend development, backend development, code review, testing, and quality assurance. By combining specialization, shared knowledge, and parallel execution, the system can generate and improve software projects with greater scalability and accuracy.

---



## Backend Structure

```text
Backend
│
├── API Layer
│   ├── agents.py
│   ├── projects.py
│   └── knowledge_graph.py
│
├── MAS Layer
│   ├── orchestrator.py
│   ├── planner.py
│   ├── architect.py
│   ├── frontend.py
│   ├── backend.py
│   ├── reviewer.py
│   └── ...
│
├── Services Layer
│   ├── llm_service.py
│   ├── workspace_manager.py
│   ├── knowledge_graph.py
│   └── file_analyzer.py
│
├── main.py
│
└── Generated Projects
```

---

# Agent Workflow

```text
User Prompt
      │
      ▼
Orchestrator
      │
      ▼
Planner Agent
      │
      ▼
Architect Agent
      │
      ▼
Parallel Specialist Agents
  ├── Frontend Agent
  ├── Backend Agent
  ├── Database Agent
  ├── DevOps Agent
  └── Other Specialists
      │
      ▼
Reviewer Agent
      │
      ▼
Merge Results
      │
      ▼
QA Agent
      │
      ▼
Writer Agent
      │
      ▼
Workspace Manager
      │
      ▼
File Analyzer
      │
      ▼
Knowledge Graph Update
```

