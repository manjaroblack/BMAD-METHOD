import type { AggregatedContent } from "./IContentAggregator.ts";

export interface IXmlGenerator {
  generate(content: AggregatedContent[], outputPath: string): Promise<void>;
}
