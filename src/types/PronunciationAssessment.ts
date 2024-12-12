export type PronunciationAssessmentResult = {
  Confidence: number;
  Lexical: string;
  ITN: string;
  MaskedITN: string;
  Display: string;
  PronunciationAssessment: PronunciationAssessment;
  Words: Word[];
};

export type PronunciationAssessment = {
  AccuracyScore: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ErrorType?: string;
};

export type Word = {
  Word: string;
  Offset: number;
  Duration: number;
  PronunciationAssessment: PronunciationAssessment;
  Syllables: Syllable[];
  Phonemes: Phoneme[];
};

export type Syllable = {
  Syllable: string;
  Grapheme: string;
  PronunciationAssessment: PronunciationAssessment;
  Offset: number;
  Duration: number;
};

export type Phoneme = {
  Phoneme: string;
  PronunciationAssessment: PronunciationAssessment;
  Offset: number;
  Duration: number;
};
