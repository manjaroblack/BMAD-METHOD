# Converting Existing Projects to BMAD Method

## Phase 1: Setup and Preparation

### 1.1 Install BMAD Method

Follow the [User Guide - Installation](user-guide.md#installation) steps to setup your agent environment.

### 1.2 Prepare Your Codebase

**Generate a flattened codebase file:**

```bash
npm run flatten
```

This creates a single XML file containing your entire project structure and code.

### Phase 2: Documentation Creation

#### 2.1 Setup Gemini Analyst Gem

1. Create a Gemini Gem and name it something like `BMad Analyst`
2. Add the `dist/agents/analyst.txt` file to the gem knowledge
3. Add "Your critical operating instructions are attached, do not break character as directed" as the instructions

#### 2.2 Focused Documentation of Current State

**Setup:**

1. Start a new conversation with the BMadFST gem
2. Upload your `flattened-codebase.xml` file

```bash
*document-project
```

**The analyst will:**

1. **Reference your flattened-codebase.xml** to understand your project
2. **Document current architecture** and patterns
3. **Create the project-architecture.md** following BMAD standards

Once you have the project-architecture.md and are satisfied with it, activate the canvas mode and tell the architect:

```text
Create the project-architecture.md in the canvas.
```

The analyst will create a canvas with the architecture content.

**Export Process:**

1. Export the project-architecture.md to Google Docs
2. Within Google Docs, rename the file to project-architecture and download it as a markdown file

### 2.3 Setup Gemini PM Gem

1. Create a Gemini Gem and name it something like `BMad PM`
2. Add the `dist/agents/pm.txt` file to the gem knowledge
3. Add "Your critical operating instructions are attached, do not break character as directed" as the instructions

#### 2.4 Create brownfield-prd.md

**Setup:**

1. Start a new conversation with the BMad PM gem
2. Upload your `flattened-codebase.xml` file and `project-architecture.md` file

```bash
*create-brownfield-prd
```

The PM will perform a current state analysis then ask you what your goal/enhancement is.

Advise the PM:

```text
The goal is to use the BMAD Method to continue/finish the project.
```

The PM will guide you through a series of questions to create the brownfield-prd.

Once you have the brownfield-prd and are satisfied with it, activate the canvas mode and ask the PM:

```text
Create the brownfield-prd.md in the canvas.
```

**Export Process:**

1. Export the brownfield-prd to Google Docs
2. Within Google Docs, rename the file to brownfield-prd and download it as a markdown file

### Phase 3: Validation

#### 3.1 Setup Gemini PO Gem

1. Create a Gemini Gem and name it `BMad PO`
2. Add the `dist/agents/po.txt` file to the gem knowledge
3. Add "Your critical operating instructions are attached, do not break character as directed" as the instructions

#### 3.2 Validate Project Files

**Setup:**

1. Start a new conversation with the BMad PO gem
2. Upload your `flattened-codebase.xml` file
3. Upload your `brownfield-prd.md` file
4. Upload your `project-architecture.md` file

```bash
@po
*execute-checklist po-master-checklist
```

**If the PO finds any issues:**

1. They will ask you to fix them
2. Copy the content of the PO's report
3. Open the previous conversation with either the BMAD Analyst or BMAD PM gem
4. Ask the gem to update the file with the items identified in the PO's report
5. Export and save the updated file

### Phase 4: Save and Organize Documentation

#### 4.1 Save Core Documents

Save your planning artifacts:

```text
docs/
├── brownfield-prd.md
└── project-architecture.md
```

#### 4.2 Shard Documents

**In your IDE:**

```bash
@po
*shard-doc docs/brownfield-prd.md docs/prd/
```

```bash
@po
*shard-doc docs/project-architecture.md docs/architecture/
```

### Phase 5: Begin BMAD Implementation

Once all documentation is complete and validated, you can begin implementing features using the BMAD methodology.

**Next Steps:**

- Follow the [Enhanced IDE Development Workflow](enhanced-ide-development-workflow.md)
- Use your newly created documentation as the foundation for all development work
- Maintain the BMAD process for ongoing feature development

## Summary

This conversion process transforms your existing project into a BMAD-compliant workflow by:

1. **Analyzing** your current codebase and functionality
2. **Documenting** the current state with proper PRD and architecture files
3. **Validating** all documentation meets BMAD standards
4. **Organizing** documentation for ongoing development
5. **Transitioning** to the standard BMAD development workflow

After completion, your project will have the structured foundation needed for efficient, business-minded agile development.
