import React, {Component} from 'react';
import './App.css';
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {PronunciationAssessmentResult} from "microsoft-cognitiveservices-speech-sdk";
import {
  Button,
  Card,
  Divider,
  Layout,
  notification,
  Radio,
  RadioChangeEvent,
  Skeleton,
  Tooltip,
} from "antd";
import {OpenAIProxyClient} from "./types/OpenAIProxyClient";
import {OpenAIGeneratedQuestion} from "./types/OpenAIResponse";
import {Scorer} from "./types/scorer";
import {scrambleArray} from "./types/utilities";
import {Content} from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";

import { QuestionCircleOutlined } from '@ant-design/icons';
import {DARK_RED, GREEN, GREEN_BORDER, LIGHT_GREEN_BACKGROUND, LIGHT_RED_BACKGROUND, RED_BORDER} from "./types/colors";
import HintsModal from "./components/HintsModal";
import PronunciationTest from "./components/Pronunciation/PronunciationTest";
import MultipleChoice from "./components/MultipleChoice";
import FreeAnswer from "./components/FreeAnswer";

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface AppState {
  domain: string;
  gameMode: 'freeAnswer' | 'verbatim' | 'multipleChoice'
  correctlyAnswered: string[]
  encountered: string[]
  openAIProxyClient: OpenAIProxyClient;
  generatedQuestion: OpenAIGeneratedQuestion | null;
  recognition: any;
  pronunciationAssessmentResult: PronunciationAssessmentResult | null;
  scorer: Scorer | null;
  answerLocked: boolean;
  currentlySelectedMultipleChoiceAnswer: string | null;
  multipleChoiceOptions: string[];
  generatingQuestion: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  hintsRevealed: number;
  siderCollapsed: boolean;
  modalOpen: boolean;
  speechRecognizer: SpeechSDK.SpeechRecognizer | null;
  isRecording: boolean;
  initialRender: boolean;
}

class App extends Component<{}, AppState> {

  constructor(props: any) {
    super(props);

    // const openAIProxy =  new OpenAIProxyClient('http://localhost', 3001);

    const openAIProxy = new OpenAIProxyClient(process.env.OPENAI_PROXY_AZURE, 3001)

    this.state = {
      gameMode: 'freeAnswer',
      correctlyAnswered: [],
      encountered: [],
      domain: 'corporate finance',
      openAIProxyClient: openAIProxy,
      scorer: new Scorer(openAIProxy),
      generatedQuestion: null,
      recognition: null,
      pronunciationAssessmentResult: null,
      answerLocked: true,
      currentlySelectedMultipleChoiceAnswer: null,
      multipleChoiceOptions: [],
      generatingQuestion: false,
      voices: [],
      selectedVoiceName: 'Daniel',
      hintsRevealed: 0,
      siderCollapsed: false,
      modalOpen: false,
      speechRecognizer: null,
      isRecording: false,
      initialRender: true,
    };
  }

  componentDidMount() {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      this.setState({ voices: availableVoices });
      if (availableVoices.length > 0) {
        this.setState({ selectedVoiceName: availableVoices[0].name });
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    this.generateQuestion();
  }

  tts(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.state.voices.find(v => v.name === this.state.selectedVoiceName)
    window.speechSynthesis.speak(utterance);
  }

  conductSpeechAssessment = () => {
    this.setState({speechRecognizer: this.state.scorer.scoreVerbatimAnswer(
      this.state.generatedQuestion.definition,
      (result) => {
        this.setState({pronunciationAssessmentResult: result})
      }
    )})
  }

  stopSpeechAssessment = () => {
    this.state.speechRecognizer.close()
  }

  generateQuestion = () =>{
    this.setState({
      generatingQuestion: true
    })

    this.state.openAIProxyClient.generateQuestion(
      this.state.domain,
      this.state.encountered
    ).then(axiosResponse => {
      const generatedQuestion = axiosResponse.data

      this.setState({generatedQuestion})

      const multipleChoiceOptions = scrambleArray<string>(generatedQuestion.multipleChoiceSiblingDefinitions.concat([generatedQuestion.definition]));

      this.setState({
        hintsRevealed: 0,
        answerLocked: false,
        generatingQuestion: false,
        initialRender: false,
        multipleChoiceOptions
      })
    }).catch(e => {
      notification.open({
        message: `Error generating new question... please try again`,
        description: `${e}`,
        style: {
          backgroundColor: LIGHT_RED_BACKGROUND,
          borderColor: RED_BORDER,
          color: DARK_RED,
        },
      });

      this.setState({
        answerLocked: false,
        generatingQuestion: false,
        initialRender: false,
      })
    })
  };

  collectFreeAnswer = () => {
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      finalTranscript += transcript;
    };

    recognition.onend = () => {
      if (finalTranscript) {
        this.state.scorer.scoreFreeAnswer(
          this.state.domain,
          this.state.generatedQuestion.word,
          finalTranscript,
          (similarityScore: number) => {
            notification.open({
              message: 'You answered correctly!',
              description: `Similarity score was ${similarityScore}`,
              style: {
                backgroundColor: LIGHT_GREEN_BACKGROUND,
                borderColor: GREEN_BORDER,
                color: GREEN,
              },
            });
            this.setState({
              correctlyAnswered: this.state.correctlyAnswered.concat([this.state.generatedQuestion.word]),
              encountered: this.state.encountered.concat([this.state.generatedQuestion.word]),
              answerLocked: true
            })
          },
          (similarityScore: number) => {
            notification.open({
              message: 'You answered incorrectly...',
              description: `Similarity score was ${similarityScore}`,
              style: {
                backgroundColor: LIGHT_RED_BACKGROUND,
                borderColor: RED_BORDER,
                color: DARK_RED,
              },
            });
            this.setState({
              encountered: this.state.encountered.concat([this.state.generatedQuestion.word]),
              answerLocked: true
            })
          }
        )
      }
    };

    recognition.onerror = (event) => {
      notification.open({
        message: 'Speech recognition error... please try again',
        description: `${ event.error }`,
        style: {
          backgroundColor: LIGHT_RED_BACKGROUND,
          borderColor: RED_BORDER,
          color: DARK_RED,
        },
      });
    };

    recognition.start()

    this.setState({
      recognition
    })
  }

  stopRecognition = () => {
    this.state.recognition.stop()
  }

  handleRadioChange = (event: RadioChangeEvent) => {
    this.setState({
      gameMode: event.target.value
    })
  }

  submitMultipleChoiceAnswer = () => {
    this.state.scorer.scoreMultipleChoice(
      this.state.currentlySelectedMultipleChoiceAnswer,
      this.state.generatedQuestion.definition,
      () => {
        notification.open({
          message: 'You answered correctly!',
          description: (
            <span>
            The definition of <strong>{this.state.generatedQuestion.word}</strong> is{' '}
              <strong>{this.state.generatedQuestion.definition}</strong>.
          </span>
          ),
          style: {
            backgroundColor: LIGHT_GREEN_BACKGROUND,
            borderColor: GREEN_BORDER,
            color: GREEN,
          },
        });
        this.setState({
          correctlyAnswered: this.state.correctlyAnswered.concat([this.state.generatedQuestion.word])
        })
      },
      () => {
        notification.open({
          message: 'You answered incorrectly...',
          description: (
            <span>
            The definition of <strong>{this.state.generatedQuestion.word}</strong> is{' '}
              <strong>{this.state.generatedQuestion.definition}</strong>.
          </span>
          ),
          style: {
            backgroundColor: LIGHT_RED_BACKGROUND,
            borderColor: RED_BORDER,
            color: DARK_RED,
          },
        });
      }
    )
    this.setState({
      answerLocked: true,
      encountered: this.state.encountered.concat([this.state.generatedQuestion.word])
    })
  }

  revealHint = () => {
    this.setState({hintsRevealed: this.state.hintsRevealed + 1})
  }

  toggleCollapse = () => {
    this.setState({siderCollapsed: !this.state.siderCollapsed})
  }

  handleModalOk = () => {
    this.setState({modalOpen: false});
  }

  handleModalCancel = () => {
    this.setState({modalOpen: false});
  }

  openModal = () => {
    this.setState({modalOpen: true});
  }

  toggleRecording = () => {
    this.setState({isRecording: !this.state.isRecording})
  }

  render() {

    const gameModeOptions = [
      { label: 'Free Response', value: 'freeAnswer' },
      { label: 'Multiple Choice', value: 'multipleChoice' },
      { label: 'Pronunciation Test', value: 'verbatim' },
    ];

    return (
      <div className="App">
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            collapsible
            collapsed={this.state.siderCollapsed}
            onCollapse={this.toggleCollapse}
            width={300}
            style={{
              background: '#e6f7ff',
              padding: this.state.siderCollapsed ? '8px' : '16px',
              overflow: 'hidden',
              transition: 'all 0.3s',
            }}
          >
            <h2
              style={{
                color: '#000',
                textAlign: 'center',
                marginBottom: this.state.siderCollapsed ? '8px' : '16px',
                fontSize: this.state.siderCollapsed ? '14px' : '18px',
                display: this.state.siderCollapsed ? 'none' : 'block',
                transition: 'all 0.3s',
              }}
            >
              Results
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: this.state.siderCollapsed ? '8px' : '16px',
                alignItems: this.state.siderCollapsed ? 'center' : 'stretch',
                transition: 'all 0.3s',
              }}
            >
              {this.state.siderCollapsed ? (
                <>
                  <Card
                    bordered={false}
                    style={{
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      textAlign: 'center',
                      width: '40px',
                      height: '40px',
                      lineHeight: '40px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    🟢
                  </Card>
                  <Card
                    bordered={false}
                    style={{
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      textAlign: 'center',
                      width: '40px',
                      height: '40px',
                      lineHeight: '40px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    📘
                  </Card>
                </>
              ) : (
                <>
                  <Card
                    title="Correctly Guessed Words"
                    bordered={false}
                    style={{
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {this.state.correctlyAnswered.map((word, index) => (
                      <p key={`guessed-${index}`}>{word}</p>
                    ))}
                  </Card>
                  <Card
                    title="Encountered Words"
                    bordered={false}
                    style={{
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {this.state.encountered.map((word, index) => (
                      <p key={`encountered-${index}`}>{word}</p>
                    ))}
                  </Card>
                </>
              )}
            </div>
          </Sider>
          <Layout>
            <Content
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100vh",
                padding: "16px",
                background: "#f0f2f5",
                overflow: "auto",
              }}
            >
              <div>
                <h2
                  style={{
                    color: "#000",
                    textAlign: "center",
                  }}
                >
                  Game Modes
                </h2>
                <div
                  style={{
                    padding: "16px",
                    background: "#f0f2f5",
                  }}
                >
                  <Radio.Group
                    block
                    options={gameModeOptions}
                    defaultValue="freeAnswer"
                    optionType="button"
                    buttonStyle="solid"
                    onChange={this.handleRadioChange}
                  />
                  <Divider />
                  <>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h2>Question</h2>
                        <Tooltip title="Click for hints">
                          <Button
                            type="link"
                            icon={<QuestionCircleOutlined style={{ fontSize: "24px", color: "#1890ff" }} />}
                            onClick={this.openModal}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </>
                  {
                    this.state.initialRender ? <Skeleton active paragraph={{ rows: 3 }} title={false} /> : <></>
                  }
                  {this.state.gameMode === "freeAnswer" && this.state.generatedQuestion ? (
                    <FreeAnswer
                      generatingQuestion={this.state.generatingQuestion}
                      generatedQuestion={this.state.generatedQuestion}
                      isRecording={this.state.isRecording}
                      answerLocked={this.state.answerLocked}
                      toggleRecording={this.toggleRecording}
                      stopRecognition={this.stopRecognition}
                      collectFreeAnswer={this.collectFreeAnswer}
                    />
                  ) : (
                    <></>
                  )}
                  {this.state.gameMode === "multipleChoice" && this.state.generatedQuestion ? (
                    <MultipleChoice
                      generatingQuestion={this.state.generatingQuestion}
                      generatedQuestion={this.state.generatedQuestion}
                      multipleChoiceOptions={this.state.multipleChoiceOptions}
                      currentlySelectedMultipleChoiceAnswer={this.state.currentlySelectedMultipleChoiceAnswer}
                      setCurrentlySelectedMultipleChoiceAnswer={(ans: string) => {
                        this.setState({
                          currentlySelectedMultipleChoiceAnswer: ans
                        })
                      }}
                      submitMultipleChoiceAnswer={this.submitMultipleChoiceAnswer}
                      answerLocked={this.state.answerLocked}
                    />
                  ) : (
                    <></>
                  )}
                  {this.state.gameMode === "verbatim" && this.state.generatedQuestion ? (
                    <PronunciationTest
                      generatingQuestion={this.state.generatingQuestion}
                      generatedQuestion={this.state.generatedQuestion}
                      isRecording={this.state.isRecording}
                      answerLocked={this.state.answerLocked}
                      toggleRecording={this.toggleRecording}
                      stopSpeechAssessment={this.stopSpeechAssessment}
                      conductSpeechAssessment={this.conductSpeechAssessment}
                      pronunciationAssessmentResult={this.state.pronunciationAssessmentResult}
                    />
                  ) : (
                    <></>
                  )}
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                }}
              >
                <Button
                  type="primary"
                  onClick={this.generateQuestion}
                  loading={this.state.generatingQuestion}
                >
                  Generate Next Question
                </Button>
              </div>
              <HintsModal
                modalOpen={this.state.modalOpen}
                handleModalOk={this.handleModalOk}
                handleModalCancel={this.handleModalCancel}
                gameMode={this.state.gameMode}
                tts={(s: string) => {
                  this.tts(s)
                }}
                generatedQuestion={this.state.generatedQuestion}
                generatingQuestion={this.state.generatingQuestion}
                selectedVoiceName={this.state.selectedVoiceName}
                setSelectedVoiceName={(value) => this.setState({ selectedVoiceName: value })}
                voices={this.state.voices}
                revealHint={this.revealHint}
                hintsRevealed={this.state.hintsRevealed}
              />
            </Content>
          </Layout>
        </Layout>
      </div>
  );
  }
  }

  export default App;
