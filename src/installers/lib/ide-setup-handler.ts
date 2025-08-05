import { green } from "deps";
import type { IIdeSetup } from "deps";

/**
 * Interface for IDE setup handling
 */
export interface IIdeSetupHandler {
  setupIdeConfigurations(
    installDir: string,
    ides: string[],
    spinner?: unknown,
  ): Promise<void>;
}

/**
 * Service for handling IDE setup configurations
 */
export class IdeSetupHandler implements IIdeSetupHandler {
  constructor(private readonly ideSetup: IIdeSetup) {}

  /**
   * Set up IDE configurations
   * @param installDir - Installation directory
   * @param ides - List of IDEs to configure
   * @param spinner - Spinner for progress indication
   */
  async setupIdeConfigurations(
    installDir: string,
    ides: string[],
    spinner?: unknown,
  ): Promise<void> {
    if (spinner) {
      // @ts-ignore - spinner.text exists but type is unknown
      spinner.text = "Setting up IDE configurations...";
    }
    try {
      for (const ide of ides) {
        if (spinner) {
          // @ts-ignore - spinner.text exists but type is unknown
          spinner.text = `Setting up ${ide} configuration...`;
        }
        await this.ideSetup.setupIdeConfigurations(installDir, [ide], spinner);
        console.log(green(`✓ ${ide} configuration set up.`));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to set up IDE configurations: ${errorMessage}`,
      );
      throw error;
    }
  }
}
