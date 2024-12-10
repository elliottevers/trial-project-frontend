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
  FluencyScore?: number; // Optional, as it only appears in the parent PronunciationAssessment
  CompletenessScore?: number; // Optional, as it only appears in the parent PronunciationAssessment
  PronScore?: number; // Optional, as it only appears in the parent PronunciationAssessment
  ErrorType?: string; // Optional, as it appears only in nested PronunciationAssessments
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
