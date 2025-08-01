#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { Command, WebBuilder } from "deps";
// Note: Upgrader functionality temporarily disabled until v3-to-v5-upgrader.ts is migrated
// import { V3ToV5Upgrader } from 'deps';

const cli = new Command()
  .name("bmad-build")
  .description("BMad-Method build tool for creating web bundles")
  .version("5.0.0");

cli.command("build")
  .description("Build web bundles for agents and teams")
  .option("-a, --agents-only", "Build only agent bundles")
  .option("-t, --teams-only", "Build only team bundles")
  .option("-e, --expansions-only", "Build only expansion pack bundles")
  .option("--no-expansions", "Skip building expansion packs")
  .option("--no-clean", "Skip cleaning output directories")
  .action(async (options: Record<string, unknown>) => {
    const builder = new WebBuilder({
      rootDir: Deno.cwd(),
    });

    try {
      if (options.clean) {
        console.log("Cleaning output directories...");
        await builder.cleanOutputDirs();
      }

      if (options.expansionsOnly) {
        console.log("Building expansion pack bundles...");
        await builder.buildAllExpansionPacks({ clean: false });
      } else {
        if (!options.teamsOnly) {
          console.log("Building agent bundles...");
          await builder.buildAgents();
        }

        if (!options.agentsOnly) {
          console.log("Building team bundles...");
          await builder.buildTeams();
        }

        if (!options.noExpansions) {
          console.log("Building expansion pack bundles...");
          await builder.buildAllExpansionPacks({ clean: false });
        }
      }

      console.log("✅ Build completed successfully!");
    } catch (error) {
      console.error("❌ Build failed:", (error as Error).message);
      Deno.exit(1);
    }
  });

cli.command("build:expansions")
  .description("Build web bundles for all expansion packs")
  .option("--expansion <name>", "Build specific expansion pack only")
  .option("--no-clean", "Skip cleaning output directories")
  .action(async (options: Record<string, unknown>) => {
    const builder = new WebBuilder({
      rootDir: Deno.cwd(),
    });

    try {
      if (options.expansion && typeof options.expansion === "string") {
        console.log(`Building expansion pack: ${options.expansion}`);
        await builder.buildExpansionPack(options.expansion, {
          clean: typeof options.clean === "boolean" ? options.clean : true,
        });
      } else {
        console.log("Building all expansion packs...");
        await builder.buildAllExpansionPacks({
          clean: typeof options.clean === "boolean" ? options.clean : true,
        });
      }

      console.log("✅ Expansion pack build completed successfully!");
    } catch (error) {
      console.error("❌ Expansion pack build failed:", (error as Error).message);
      Deno.exit(1);
    }
  });

cli.command("list:agents")
  .description("List all available agents")
  .action(async () => {
    const builder = new WebBuilder({ rootDir: Deno.cwd() });
    const agents = await builder.listAgents();
    console.log("Available agents:", agents);
  });

cli.command("list:teams")
  .description("List all available teams")
  .action(async () => {
    const builder = new WebBuilder({ rootDir: Deno.cwd() });
    const teams = await builder.listTeams();
    console.log("Available teams:", teams);
  });

cli.command("list:expansions")
  .description("List all available expansion packs")
  .action(async () => {
    const builder = new WebBuilder({ rootDir: Deno.cwd() });
    const expansions = await builder.listExpansionPacks();
    console.log("Available expansion packs:", expansions);
  });

cli.command("validate")
  .description("Validate agent and team configurations")
  .action(async () => {
    const builder = new WebBuilder({ rootDir: Deno.cwd() });

    try {
      console.log("🔍 Validating configurations...");

      const agentValidation = await builder.validateAgents();
      const teamValidation = await builder.validateTeams();
      const expansionValidation = await builder.validateExpansionPacks();

      if (agentValidation.valid && teamValidation.valid && expansionValidation.valid) {
        console.log("✅ All configurations are valid!");
      } else {
        console.log("❌ Validation failed:");
        if (!agentValidation.valid) {
          console.log("Agent errors:", agentValidation.errors);
        }
        if (!teamValidation.valid) {
          console.log("Team errors:", teamValidation.errors);
        }
        if (!expansionValidation.valid) {
          console.log("Expansion pack errors:", expansionValidation.errors);
        }
        Deno.exit(1);
      }
    } catch (error) {
      console.error("❌ Validation failed:", (error as Error).message);
      Deno.exit(1);
    }
  });

// TODO: Re-enable upgrade command once v3-to-v5-upgrader.ts is migrated
/*
cli.command("upgrade")
  .description("Upgrade a BMad-Method V3 project to V5")
  .option("-p, --project <path>", "Path to V3 project (defaults to current directory)")
  .option("--dry-run", "Show what would be changed without making changes")
  .option("--no-backup", "Skip creating backup (not recommended)")
  .action(async (options: any) => {
    const upgrader = new V3ToV5Upgrader();
    await upgrader.upgrade({
      projectPath: options.project || Deno.cwd(),
      dryRun: options.dryRun || false,
      noBackup: options.noBackup || false
    });

    try {
      await upgrader.upgrade();
      console.log("✅ Project upgrade completed successfully!");
    } catch (error) {
      console.error("❌ Upgrade failed:", (error as Error).message);
      Deno.exit(1);
    }
  });
*/

if (import.meta.main) {
  await cli.parse(Deno.args);
}
