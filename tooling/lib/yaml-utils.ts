/**
 * Utility functions for YAML extraction from agent files
 */

/**
 * Extract YAML content from agent markdown files
 * @param agentContent - The full content of the agent file
 * @param cleanCommands - Whether to clean command descriptions (default: false)
 * @returns The extracted YAML content or null if not found
 */
export function extractYamlFromAgent(
  agentContent: string,
  cleanCommands = false,
): string | null {
  // Remove carriage returns and match YAML block
  const yamlMatch = agentContent.replace(/\r/g, "").match(/```ya?ml\n([\s\S]*?)\n```/);
  if (!yamlMatch) return null;

  let yamlContent = yamlMatch[1].trim();

  // Clean up command descriptions if requested
  // Converts "- command - description" to just "- command"
  if (cleanCommands) {
    yamlContent = yamlContent.replace(/^(\s*-)(\s*"[^"]+")(\s*-\s*.*)$/gm, "$1$2");
  }

  return yamlContent;
}