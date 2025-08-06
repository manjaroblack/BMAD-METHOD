export interface AggregatedContent {
  path: string;
  content: string;
  size: number;
  type: string;
}

export interface IContentAggregator {
  aggregate(filePaths: string[], rootDir: string): Promise<AggregatedContent[]>;
}
