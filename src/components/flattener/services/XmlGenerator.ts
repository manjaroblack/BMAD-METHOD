import { XmlGenerationError } from "../../../core/errors/XmlGenerationError.ts";
import type { AggregatedContent } from "../interfaces/IContentAggregator.ts";
import type { IXmlGenerator } from "../interfaces/IXmlGenerator.ts";

export class XmlGenerator implements IXmlGenerator {
  /**
   * Escape XML special characters
   * @param str - String to escape
   * @returns Escaped string
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Indent file content for XML
   * @param content - File content
   * @returns Indented content
   */
  private indentFileContent(content: string): string {
    return content
      .split("\n")
      .map((line) => `        ${line}`)
      .join("\n");
  }

  /**
   * Split and wrap content in CDATA
   * @param content - Content to wrap
   * @returns CDATA wrapped content
   */
  private splitAndWrapCDATA(content: string): string {
    const cdataStart = "        <![CDATA[\n";
    const cdataEnd = "\n        ]]>\n";
    return cdataStart + content + cdataEnd;
  }

  /**
   * Calculate statistics
   * @param aggregatedContent - Array of file information
   * @param xmlFileSize - Size of generated XML file
   * @returns Statistics object
   */
  private calculateStatistics(
    aggregatedContent: AggregatedContent[],
    xmlFileSize: number,
  ): {
    totalFiles: number;
    totalSize: number;
    xmlFileSize: number;
    largestFile: { path: string; size: number };
    fileTypes: Record<string, number>;
  } {
    const totalFiles = aggregatedContent.length;
    const totalSize = aggregatedContent.reduce((sum, file) => sum + file.size, 0);

    const largestFile = aggregatedContent.reduce(
      (largest, file) => (file.size > largest.size ? file : largest),
      { path: "", size: 0 } as { path: string; size: number },
    );

    const fileTypes: Record<string, number> = {};
    for (const file of aggregatedContent) {
      fileTypes[file.type] = (fileTypes[file.type] || 0) + 1;
    }

    return {
      totalFiles,
      totalSize,
      xmlFileSize,
      largestFile,
      fileTypes,
    };
  }

  /**
   * Generate XML output
   * @param aggregatedContent - Array of file information
   * @param outputPath - Output file path
   */
  async generate(
    aggregatedContent: AggregatedContent[],
    outputPath: string,
  ): Promise<void> {
    try {
      const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<codebase>\n`;
      const xmlFooter = `</codebase>\n`;

      let xmlContent = xmlHeader;

      // Add metadata
      xmlContent += `  <metadata>\n`;
      xmlContent += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
      xmlContent += `    <total_files>${aggregatedContent.length}</total_files>\n`;
      xmlContent += `    <generator>BMad-Method Flattener v1.0.0</generator>\n`;
      xmlContent += `  </metadata>\n\n`;

      // Add files
      xmlContent += `  <files>\n`;
      for (const file of aggregatedContent) {
        xmlContent += `    <file>\n`;
        xmlContent += `      <path>${this.escapeXml(file.path)}</path>\n`;
        xmlContent += `      <type>${this.escapeXml(file.type)}</type>\n`;
        xmlContent += `      <size>${file.size}</size>\n`;
        xmlContent += `      <content>\n`;
        xmlContent += this.splitAndWrapCDATA(this.indentFileContent(file.content));
        xmlContent += `      </content>\n`;
        xmlContent += `    </file>\n\n`;
      }
      xmlContent += `  </files>\n`;

      xmlContent += xmlFooter;

      await Deno.writeTextFile(outputPath, xmlContent);

      // Calculate and display statistics
      const xmlStats = await Deno.stat(outputPath);
      const statistics = this.calculateStatistics(aggregatedContent, xmlStats.size);

      // Display results
      console.log("\n✅ Flattening completed successfully!");
      console.log("\n📊 Statistics:");
      console.log(`   📁 Total files processed: ${statistics.totalFiles}`);
      console.log(`   📏 Total source size: ${(statistics.totalSize / 1024).toFixed(2)} KB`);
      console.log(`   📄 XML output size: ${(statistics.xmlFileSize / 1024).toFixed(2)} KB`);
      console.log(
        `   📈 Largest file: ${statistics.largestFile.path} (${
          (statistics.largestFile.size / 1024).toFixed(2)
        } KB)`,
      );
      console.log("\n📋 File types:");
      for (const [type, count] of Object.entries(statistics.fileTypes)) {
        console.log(`   ${type}: ${count} files`);
      }
      console.log("\n");
      console.log(`💾 Output saved to: ${outputPath}`);
    } catch (error) {
      throw new XmlGenerationError(
        `Failed to generate XML output: ${(error as Error).message}`,
        "XML_GENERATION_ERROR",
        error as Error | undefined,
      );
    }
  }
}

// Factory function for DI container
export function createXmlGenerator(): IXmlGenerator {
  return new XmlGenerator();
}
