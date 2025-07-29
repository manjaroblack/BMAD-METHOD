#!/usr/bin/env -S deno run --allow-read --allow-run

import { blue, bold, cyan, gray, green, red, yellow } from "deps";

// Note: dim is not available in deps.ts, using gray as alternative
const dim = gray;

/**
 * Simple version bumping script for BMad-Method
 * Usage: deno run --allow-read --allow-run version-bump.ts [patch|minor|major]
 */

function getCurrentVersion(): string {
  const denoJsonContent = Deno.readTextFileSync("deno.json");
  const denoJson = JSON.parse(denoJsonContent);
  return denoJson.version || "1.0.0";
}

function bumpVersion(type = "patch"): null {
  const validTypes = ["patch", "minor", "major"];
  if (!validTypes.includes(type)) {
    console.error(
      red(`Invalid version type: ${type}. Use: ${validTypes.join(", ")}`),
    );
    Deno.exit(1);
  }

  console.log(yellow("⚠️  Manual version bumping is disabled."));
  console.log(
    blue(
      "🤖 This project uses semantic-release for automated versioning.",
    ),
  );
  console.log("");
  console.log(bold("To create a new release, use conventional commits:"));
  console.log(cyan("  feat: new feature (minor version bump)"));
  console.log(cyan("  fix: bug fix (patch version bump)"));
  console.log(cyan("  feat!: breaking change (major version bump)"));
  console.log("");
  console.log(
    dim('Example: git commit -m "feat: add new installer features"'),
  );
  console.log(
    dim("Then push to main branch to trigger automatic release."),
  );

  return null;
}

async function main(): Promise<void> {
  const type = Deno.args[0] || "patch";
  const currentVersion = getCurrentVersion();

  console.log(blue(`Current version: ${currentVersion}`));

  // Check if working directory is clean
  try {
    const command = new Deno.Command("git", {
      args: ["diff-index", "--quiet", "HEAD", "--"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await command.output();

    if (!success) {
      console.error(
        red(
          "❌ Working directory is not clean. Commit your changes first.",
        ),
      );
      Deno.exit(1);
    }
  } catch (_error) {
    console.error(
      red(
        "❌ Working directory is not clean. Commit your changes first.",
      ),
    );
    Deno.exit(1);
  }

  const newVersion = await bumpVersion(type);

  console.log(green(`\n🎉 Version bump complete!`));
  console.log(blue(`📦 ${currentVersion} → ${newVersion}`));
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

export { bumpVersion, getCurrentVersion };
