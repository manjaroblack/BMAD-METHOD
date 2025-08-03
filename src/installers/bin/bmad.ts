#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { Checkbox, Command, Input, Select, blue, bold, cyan, dirname, flattener, green, join, magenta, parseYaml, red, resolve, yellow, ExpansionPack, ExpansionPackInfo, InstallationState, InstallConfig, Installer } from "deps";

// Handle both execution contexts (from root via deno or from installer directory)
let version: string = "1.0.0"; // Default version, will be overridden by deno.json

async function initializeInstaller(): Promise<void> {
  try {
    // Determine the correct path to deno.json
    const currentDir = new URL(".", import.meta.url).pathname;
    const denoJsonPath = join(currentDir, "..", "..", "..", "deno.json");
    
    // Read and parse deno.json to get version
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);
    version = denoJson.version || "1.0.0";
    
    // installer is already an instance from deps.ts
  } catch (error) {
    console.error(
      "Error: Could not load required modules. Please ensure you are running from the correct directory.",
    );
    console.error("Debug info:", {
      cwd: Deno.cwd(),
      error: error instanceof Error ? error.message : String(error),
    });
    Deno.exit(1);
  }
}

await initializeInstaller();

const cli = new Command()
  .name("bmad")
  .version(version)
  .description(
    "BMad Method installer - Universal AI agent framework for any domain",
  );

cli.command("install")
  .description("Install BMad Method agents and tools")
  .option("-f, --full", "Install complete BMad Method")
  .option(
    "-x, --expansion-only",
    "Install only expansion packs (no .bmad-core)",
  )
  .option("-d, --directory <path:string>", "Installation directory")
  .option(
    "-i, --ide <ide...:string>",
    "Configure for specific IDE(s) - can specify multiple (cursor, claude-code, windsurf, trae, roo, cline, gemini, github-copilot, other)",
  )
  .option(
    "-e, --expansion-packs <packs...:string>",
    "Install specific expansion packs (can specify multiple)",
  )
  .action(async (options) => {
    try {
      if (Object.keys(options).length === 0) {
        // No options provided, run interactive installation
        await promptInstallation();
      } else {
        // Run with provided options
        const installOptions: InstallConfig = {
          directory: options.directory || Deno.cwd(),
          full: options.full,
          expansionOnly: options.expansionOnly,
          ides: options.ide,
          expansionPacks: options.expansionPacks,
        };

        console.log(bold(blue("🚀 Starting BMad Method installation...")));
        await Installer.install(installOptions);
        console.log(bold(green("✅ Installation completed successfully!")));
      }
    } catch (error) {
      console.error(
        bold(red("❌ Installation failed:")),
        error instanceof Error ? error.message : String(error),
      );
      Deno.exit(1);
    }
  });

cli.command("update")
  .description("Update existing BMad installation")
  .option("--force", "Force update, overwriting modified files")
  .option("--dry-run", "Show what would be updated without making changes")
  .action(async (options) => {
    try {
      console.log(bold(blue("🔄 Updating BMad Method installation...")));
      await Installer.update(options);
      console.log(bold(green("✅ Update completed successfully!")));
    } catch (error) {
      console.error(
        bold(red("❌ Update failed:")),
        error instanceof Error ? error.message : String(error),
      );
      Deno.exit(1);
    }
  });

cli.command("list:expansions")
  .description("List available expansion packs")
  .action(async () => {
    try {
      const expansions = await Installer.getAvailableExpansionPacks();
      console.log(bold(blue("📦 Available Expansion Packs:")));
      expansions.forEach((pack: ExpansionPack) => {
        console.log(
          `  ${green(pack.id)} - ${pack.shortTitle} (v${pack.version})`,
        );
      });
    } catch (error) {
      console.error(
        bold(red("❌ Failed to list expansions:")),
        error instanceof Error ? error.message : String(error),
      );
      Deno.exit(1);
    }
  });

cli.command("status")
  .description("Show installation status")
  .action(async () => {
    try {
      const status = await Installer.getInstallationStatus(Deno.cwd());
      console.log(bold(blue("📊 Installation Status:")));
      console.log(JSON.stringify(status, null, 2));
    } catch (error) {
      console.error(
        bold(red("❌ Failed to get status:")),
        error instanceof Error ? error.message : String(error),
      );
      Deno.exit(1);
    }
  });

cli.command("flatten")
  .description("Flatten codebase to XML format")
  .option("-i, --input <path:string>", "Input directory to flatten", {
    default: Deno.cwd(),
  })
  .option("-o, --output <path:string>", "Output file path", {
    default: "flattened-codebase.xml",
  })
  .action(async (options) => {
    try {
      console.log(bold(blue("📄 Flattening codebase...")));
      
      // Execute the flattener with the provided options
      await flattener.parse([
        "--input", options.input,
        "--output", options.output
      ]);
      
      console.log(bold(green("✅ Codebase flattening completed successfully!")));
    } catch (error) {
      console.error(
        bold(red("❌ Flattening failed:")),
        error instanceof Error ? error.message : String(error),
      );
      Deno.exit(1);
    }
  });

async function promptInstallation(): Promise<void> {
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
  console.log(bold(blue(`✨ Installer v${version}\n`)));

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
  const state: InstallationState = await Installer.detectInstallationState(
    installDir,
  );

  // Check for existing expansion packs
  const existingExpansionPacks = state.expansionPacks || {};

  // Get available expansion packs
  const availableExpansionPacks = await Installer.getAvailableExpansionPacks();

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
    const newVersion = version; // Always use deno.json version
    const versionInfo = currentVersion === newVersion
      ? `(v${currentVersion} - reinstall)`
      : `(v${currentVersion} → v${newVersion})`;
    bmadOptionText = `Update ${coreShortTitle} ${versionInfo} .bmad-core`;
  } else {
    bmadOptionText = `${coreShortTitle} (v${version}) .bmad-core`;
  }

  choices.push({
    name: bmadOptionText,
    value: ".bmad-core",
  });

  // Add expansion pack options
  for (const pack of availableExpansionPacks) {
    const existing = existingExpansionPacks[pack.id] as ExpansionPackInfo;
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

    await Installer.install(installOptions);
    console.log(bold(green("✅ Installation completed successfully!")));
  } catch (error) {
    console.error(
      bold(red("❌ Installation failed:")),
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  try {
    await cli.parse(Deno.args);
  } catch (error) {
    console.error(
      bold(red("❌ CLI Error:")),
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }

  // Show help if no arguments provided
  if (!Deno.args.length) {
    cli.showHelp();
  }
}
