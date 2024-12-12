import {OpenAIProxyClient} from "./OpenAIProxyClient";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {notification} from "antd";
import {DARK_RED, LIGHT_RED_BACKGROUND, RED_BORDER} from "./colors";

export class Scorer {

  THRESHOLD_FREE_ANSWER = .5

  openAIProxyClient: OpenAIProxyClient;

  constructor(openAIProxyClient: OpenAIProxyClient) {
    this.openAIProxyClient = openAIProxyClient;
  }

  scoreVerbatimAnswer(groundTruth: string, onTranscription: (result: SpeechSDK.PronunciationAssessmentResult) => void): SpeechSDK.SpeechRecognizer {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      process.env.AZURE_VOCAL_SERVICE_KEY,
      process.env.AZURE_VOCAL_SERVICE_REGION
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
          notification.open({
            message: 'Something went wrong with vocal transcription.',
            description: `Please try again.`,
            style: {
              backgroundColor: LIGHT_RED_BACKGROUND,
              borderColor: RED_BORDER,
              color: DARK_RED,
            },
          });
        }

        recognizer.close();
      },
      (err) => {
        notification.open({
          message: 'Something went wrong with vocal transcription.',
          description: `${err}`,
          style: {
            backgroundColor: LIGHT_RED_BACKGROUND,
            borderColor: RED_BORDER,
            color: DARK_RED,
          },
        });
        recognizer.close();
      }
    );

    return recognizer;
  }

  scoreFreeAnswer(
    domain: string,
    word: string,
    userAnswer: string,
    onCorrect: (similarityScore: number) => void,
    onIncorrect: (similarityScore: number) => void
  ): void {
    this.openAIProxyClient.scoreUserAnswer(
      domain,
      word,
      userAnswer
    ).then(axiosResponse => {
      if (axiosResponse.data.similarityScore > this.THRESHOLD_FREE_ANSWER) {
        onCorrect(axiosResponse.data.similarityScore);
      } else {
        onIncorrect(axiosResponse.data.similarityScore);
      }
    }).catch(e => {
      notification.open({
        message: 'Something went wrong with answer scoring.',
        description: `${e}`,
        style: {
          backgroundColor: LIGHT_RED_BACKGROUND,
          borderColor: RED_BORDER,
          color: DARK_RED,
        },
      });
    })
  }


  scoreMultipleChoice(
    selectedAnswerText: string,
    correctDefinition: string,
    onCorrect: () => void,
    onIncorrect: () => void
  ){
    if (selectedAnswerText === correctDefinition) {
      onCorrect()
    } else {
      onIncorrect()
    }
  }
}