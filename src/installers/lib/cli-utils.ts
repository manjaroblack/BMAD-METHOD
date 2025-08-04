import {
  blue,
  bold,
  cyan,
  join,
  magenta,
} from "deps";

// Default version, will be overridden by deno.json
let version: string = "1.0.0";

/**
 * Initialize the installer and load version from deno.json
 */
export async function initializeInstaller(): Promise<void> {
  try {
    // Determine the correct path to deno.json
    const currentDir = new URL(".", import.meta.url).pathname;
    const denoJsonPath = join(currentDir, "..", "..", "..", "deno.json");

    // Read and parse deno.json to get version
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);
    version = denoJson.version || "1.0.0";
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

/**
 * Get the current installer version
 */
export function getVersion(): string {
  return version;
}

/**
 * Display the ASCII logo
 */
export function displayLogo(): void {
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
}
