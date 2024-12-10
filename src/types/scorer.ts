import {OpenAIProxyClient} from "./OpenAIProxyClient";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export enum GameMode {
  FREE, // requires text to score
  VERBATIM, // requires audio to score
  MULTIPLE_CHOICE // requires index of clicked option to score
}

export enum IndexMultipleChoice {
  FIRST,
  SECOND,
  THIRD,
  FOURTH
}

export class Scorer {

  openAIProxyClient: OpenAIProxyClient;

  constructor(openAIProxyClient: OpenAIProxyClient) {
    this.openAIProxyClient = openAIProxyClient;
  }

  // uses OpenAI
  scoreFreeAnswer(trueAnswer: string, provided: string) {
    // this.openAIProxyClient
  }

  scoreVerbatimAnswer(groundTruth: string, onTranscription: (result: SpeechSDK.PronunciationAssessmentResult) => void): SpeechSDK.SpeechRecognizer {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      "34JhircvYMKZxfu9zlUpmuPrwWG4UkPZ34qkW5FTGvRvJiMsv5h9JQQJ99ALAC4f1cMXJ3w3AAAYACOGGUF8",
      "westus"
    );

    const pronunciationConfig = SpeechSDK.PronunciationAssessmentConfig.fromJSON(
      JSON.stringify({
        referenceText: groundTruth,
        gradingSystem: "HundredMark",
        granularity: "Phoneme",
        phonemeAlphabet: "IPA",
      })
    );

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    pronunciationConfig.applyTo(recognizer);

    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const pronunciationAssessmentResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
          onTranscription(pronunciationAssessmentResult);
        } else {
          console.log("Something went wrong with vocal transcription");
        }

        recognizer.close();
      },
      (err) => {
        console.log(`Error with vocal transcription: ${err}`);
        recognizer.close();
      }
    );

    return recognizer;
  }

  // scoreMultipleChoice(index: number)
}





// type Root = {
//   privPronJson: PrivPronJson;
// };


// "Confidence": 0.9822811,
//   "Lexical": "This is the definition of a word",
//   "ITN": "This is the definition of a word",
//   "MaskedITN": "this is the definition of a word",
//   "Display": "This is the definition of a word.",
//   "PronunciationAssessment": {
//   "AccuracyScore": 100,
//     "FluencyScore": 100,
//     "CompletenessScore": 100,
//     "PronScore": 100
// },
// "Words": [
//   {
//     "Word": "This",
//     "Offset": 8800000,
//     "Duration": 5600000,
//     "PronunciationAssessment": {
//       "AccuracyScore": 100,
//       "ErrorType": "None"
//     },
//     "Syllables": [
//       {
//         "Syllable": "ðɪs",
//         "Grapheme": "this",
//         "PronunciationAssessment": {
//           "AccuracyScore": 100
//         },
//         "Offset": 8800000,
//         "Duration": 5600000
//       }
//     ],
//     "Phonemes": [
//       {
//         "Phoneme": "ð",
//         "PronunciationAssessment": {
//           "AccuracyScore": 100
//         },
//         "Offset": 8800000,
//         "Duration": 2800000
//       },
//       {
//         "Phoneme": "ɪ",
//         "PronunciationAssessment": {
//           "AccuracyScore": 100
//         },
//         "Offset": 11700000,
//         "Duration": 1300000
//       },
//       {
//         "Phoneme": "s",
//         "PronunciationAssessment": {
//           "AccuracyScore": 100
//         },
//         "Offset": 13100000,
//         "Duration": 1300000
//       }
//     ]
//   },