export interface OpenAIGeneratedQuestion {
  word: string;
  definition: string;
  multipleChoiceSiblingDefinitions: string[];
  exampleUsages: string[];
}

export interface OpenAIScoredUserAnswer {
  similarityScore: number
}
