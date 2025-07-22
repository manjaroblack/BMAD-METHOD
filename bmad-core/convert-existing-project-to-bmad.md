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

### 1.3 Setup Gemini

1. Create a Gemini Gem and name it something like `BMadFST`
2. Add the `dist/teams/team-fullstack.txt` file to the gem knowledge
3. Add "Your critical operating instructions are attached, do not break character as directed" as the instructions
4. Start a new chat with the gem
5. Upload your `flattened-codebase.xml` file

### Phase 2: Documentation Creation

#### 2.1 Create brownfield-prd.md

In your Gemini gem (with flattened-codebase.xml uploaded):

```bash
@pm
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
Write the PRD to a document in the canvas.
```

**Export Process:**

1. Export the brownfield-prd to Google Docs
2. Within Google Docs, download the brownfield-prd as a markdown file

#### 2.2 Focused Documentation of Current State

**Setup:**

1. Start a new conversation with the BMadFST gem
2. Upload your `flattened-codebase.xml` file
3. Upload your `brownfield-prd.md` file

```bash
@architect
*create-brownfield-architecture
```

**The architect will:**

1. **Reference your brownfield-prd** to understand scope
2. **Document current architecture** and patterns
3. **Create the brownfield-architecture.md** following BMAD standards

Once you have the brownfield-architecture.md and are satisfied with it, activate the canvas mode and tell the architect:

```text
Write the architecture to a document in the canvas.
```

**Export Process:**

1. Export the brownfield-architecture.md to Google Docs
2. Within Google Docs, download the brownfield-architecture.md as a markdown file

### Phase 3: Validation

**Setup:**

1. Start a new conversation with the BMadFST gem
2. Upload your `flattened-codebase.xml` file
3. Upload your `brownfield-prd.md` file
4. Upload your `brownfield-architecture.md` file

```bash
@po
*execute-checklist po-master-checklist
```

**If the PO finds any issues:**

1. They will ask you to fix them
2. Run the following command:

   ```bash
   @architect
   update the brownfield-architecture.md with the items identified in the PO's report
   ```

3. Export and save the updated brownfield-architecture.md

### Phase 4: Save and Organize Documentation

#### 4.1 Save Core Documents

Save your planning artifacts:

```text
docs/
├── brownfield-prd.md
└── brownfield-architecture.md
```

#### 4.2 Shard Documents

**In your IDE:**

```bash
@po
*shard-doc docs/brownfield-prd.md docs/prd/
```

```bash
@po
*shard-doc docs/brownfield-architecture.md docs/architecture/
```

Ensure your new documents are sharded into `docs/prd/` and `docs/architecture/` directories.

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
