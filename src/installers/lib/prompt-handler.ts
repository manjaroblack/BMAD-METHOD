import {
  blue,
  bold,
  Checkbox,
  cyan,
  dirname,
  ExpansionPackInfo,
  green,
  Input,
  InstallationState,
  InstallConfig,
  InstallerValidator,
  ExpansionPackHandler,
  ConfigLoader,
  FileManager,
  IdeSetup,
  ResourceLocator,
  PromptHandler,
  InstallerOrchestrator,
  logger,
  join,
  magenta,
  parseYaml,
  red,
  resolve,
  Select,
  yellow,
} from "deps";

/**
 * Handle interactive installation prompts
 */
export async function promptInstallation(): Promise<void> {
  // Display ASCII logo
  console.log(bold(cyan(`
██████╗ ███╗   ███╗ █████╗ ██████╗       ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ 
██╔══██╗████╗ ████║██╔══██╗██╔══██╗      ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗
██████╔╝██╔████╔██║███████║██║  ██║█████╗██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║
██╔══██╗██║╚██╔╝██║██╔══██║██║  ██║╚════╝██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║
██████╔╝██║ ╚═╝ ██║██║  ██║██████╔╝      ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝
╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝       ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
  `)));

  console.log(
    bold(magenta("🚀 Universal AI Agent Framework for Any Domain")),
  );
  console.log(bold(blue(`✨ Installer v5.0.0\n`)));

  const answers: InstallConfig = {};

  // Ask for installation directory first
  const directory = await Input.prompt({
    message:
      "Enter the full path to your project directory where BMad should be installed:",
    validate: (input: string) => {
      if (!input.trim()) {
        return "Please enter a valid project path";
      }
      return true;
    },
  });
  answers.directory = directory;

  // Detect existing installations
  const installDir = resolve(directory);
  const validator = new InstallerValidator();
  const state: InstallationState = await validator.detectInstallationState(
    installDir,
  );

  // Check for existing expansion packs
  const existingExpansionPacks = state.expansionPacks || {};

  // Get available expansion packs
  const configLoader = new ConfigLoader();
  const fileManager = new FileManager();
  const resourceLocator = new ResourceLocator();
  const expansionPackHandler = new ExpansionPackHandler(configLoader, fileManager, resourceLocator);
  const availableExpansionPacks = await expansionPackHandler.getAvailableExpansionPacks();

  // Build choices list
  const choices: Array<{ name: string; value: string }> = [];

  // Load core config to get short-title
  const currentDir = new URL(".", import.meta.url).pathname;
  const coreConfigPath = join(
    dirname(currentDir),
    "..",
    "..",
    "core",
    "core-config.yaml",
  );
  const coreConfigContent = await Deno.readTextFile(coreConfigPath);
  const coreConfig = parseYaml(coreConfigContent) as Record<string, unknown>;
  const coreShortTitle = coreConfig["short-title"] || "BMad Agile Core System";

  // Add BMad core option
  let bmadOptionText: string;
  if (state.type === "v5_existing") {
    const currentVersion = state.manifest?.version || "unknown";
    const newVersion = "5.0.0"; // Always use deno.json version
    const versionInfo = currentVersion === newVersion
      ? `(v${currentVersion} - reinstall)`
      : `(v${currentVersion} → v${newVersion})`;
    bmadOptionText = `Update ${coreShortTitle} ${versionInfo} .bmad-core`;
  } else {
    bmadOptionText =
      `${coreShortTitle} (v5.0.0) .bmad-core`;
  }

  choices.push({
    name: bmadOptionText,
    value: ".bmad-core",
  });

  // Add expansion pack options
  for (const pack of availableExpansionPacks) {
    const existing = existingExpansionPacks[pack.id] as
      | ExpansionPackInfo
      | undefined;
    let packOptionText: string;

    if (existing) {
      const currentVersion = existing.manifest?.version || "unknown";
      const newVersion = pack.version;
      const versionInfo = currentVersion === newVersion
        ? `(v${currentVersion} - reinstall)`
        : `(v${currentVersion} → v${newVersion})`;
      packOptionText = `Update ${pack.shortTitle} ${versionInfo} .${pack.id}`;
    } else {
      packOptionText = `${pack.shortTitle} (v${pack.version}) .${pack.id}`;
    }

    choices.push({
      name: packOptionText,
      value: pack.id,
    });
  }

  // Ask user to select what to install
  const selectedPacks = await Checkbox.prompt({
    message: "Select what to install/update:",
    options: choices,
    default: [".bmad-core"], // Default to core selected
  });

  answers.selectedPacks = selectedPacks;

  // Ask for IDE configuration if core is selected
  if (selectedPacks.includes(".bmad-core")) {
    const ideChoices = [
      "cursor",
      "claude-code",
      "windsurf",
      "trae",
      "roo",
      "cline",
      "gemini",
      "github-copilot",
      "other",
    ];

    const selectedIdes = await Checkbox.prompt({
      message: "Select IDE(s) to configure (optional):",
      options: ideChoices,
    });

    answers.ides = selectedIdes;
  }

  // Confirm installation
  const confirm = await Select.prompt({
    message: "Proceed with installation?",
    options: [
      { name: "Yes, install now", value: true },
      { name: "No, cancel", value: false },
    ],
  });

  if (!confirm) {
    console.log(yellow("Installation cancelled."));
    return;
  }

  // Perform installation
  try {
    console.log(bold(blue("🚀 Starting installation...")));

    const installOptions = {
      directory: answers.directory,
      selectedPacks: answers.selectedPacks,
      ides: answers.ides || [],
    };

    // Create orchestrator instance with dependencies
    const fileManager = new FileManager();
    const ideSetup = new IdeSetup(fileManager);
    const configLoader = new ConfigLoader();
    const resourceLocator = new ResourceLocator();
    const installerValidator = new InstallerValidator();
    const promptHandler = new PromptHandler();
    const orchestrator = new InstallerOrchestrator(
      logger,
      fileManager,
      ideSetup,
      configLoader,
      resourceLocator,
      installerValidator,
      promptHandler,
    );
    await orchestrator.install(installOptions);
    console.log(bold(green("✅ Installation completed successfully!")));
  } catch (error) {
    console.error(
      bold(red("❌ Installation failed:")),
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}
