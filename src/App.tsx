import React, {Component} from 'react';
import './App.css';
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {AudioConfig, PronunciationAssessmentResult} from "microsoft-cognitiveservices-speech-sdk";
import {
  Button,
  Card,
  Divider,
  Layout,
  Modal,
  notification,
  Radio,
  RadioChangeEvent,
  Select,
  Skeleton,
  Space,
  Tooltip
} from "antd";
import {OpenAIProxyClient} from "./types/OpenAIProxyClient";
import {OpenAIGeneratedQuestion} from "./types/OpenAIResponse";
import CustomTree from "./CustomTree";
import {Scorer} from "./types/scorer";
import {scrambleArray} from "./types/utilities";
import
{ Typography }
  from
    "antd"
  ;
import {Content} from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { AudioOutlined } from "@ant-design/icons";

import { QuestionCircleOutlined } from '@ant-design/icons';


const { Option } = Select;

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface AppProps {
}

interface AppState {
  domain: string;
  gameMode: 'freeAnswer' | 'verbatim' | 'multipleChoice'
  voiceIndex: number
  accent: 'TODO'
  correctlyAnswered: string[]
  encountered: string[]
  freeAnswer: string;
  multipleChoiceSelection: 0 | 1 | 2 | 3;
  microphoneInput: AudioConfig | null;
  openAIProxyClient: OpenAIProxyClient;
  generatedQuestion: OpenAIGeneratedQuestion | null;
  score: number | null;
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

class App extends Component<AppProps, AppState> {

  constructor(props: any) {
    super(props);
    this.state = {
      gameMode: 'freeAnswer',
      voiceIndex: 17,
      accent: 'TODO',
      correctlyAnswered: [],
      encountered: [],

      domain: 'corporate finance',
      freeAnswer: '',

      multipleChoiceSelection: 0,

      microphoneInput: null,
      openAIProxyClient: new OpenAIProxyClient('http://localhost', 3001),
      generatedQuestion: null,
      score: null,
      recognition: null,
      pronunciationAssessmentResult: null,
      scorer: new Scorer(new OpenAIProxyClient('http://localhost', 3001)),
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
    try {
      this.state.openAIProxyClient.generateQuestion(
        this.state.domain,
        this.state.encountered
      ).then(axiosResponse => {
        const generatedQuestion = axiosResponse.data
        this.setState({generatedQuestion})

        const multipleChoiceOptions = scrambleArray<string>(generatedQuestion.multipleChoiceSiblingDefinitions.map(s => {
          return s.split(": ").slice(1).join(": ");
        }).concat([generatedQuestion.definition]));

        this.setState({hintsRevealed: 0})

        this.setState({multipleChoiceOptions});

        this.setState({answerLocked: false});

        this.setState({
          generatingQuestion: false
        })

        this.setState({
          initialRender: false
        })
      })
      const test = 1;
    } catch (error) {
      const test = 1;
    } finally {
      const test = 1;
    }
  };

  collectFreeAnswer = () => {
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US'; // Set language
    recognition.interimResults = false; // Only get finalized results
    recognition.continuous = true; // Stop listening automatically after a pause

    let finalTranscript = ''; // To store the completed transcript

    // When speech is recognized
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript; // Get the first result
      finalTranscript += transcript; // Append to final transcript
      console.log('Transcript:', finalTranscript);
    };

    recognition.onend = () => {
      console.log('Speech recognition finished');
      if (finalTranscript) {
        this.state.openAIProxyClient.scoreUserAnswer(
          this.state.domain,
          this.state.generatedQuestion.word,
          finalTranscript
        ).then(axiosResponse => {
          if (axiosResponse.data.similarityScore > .5) {
            this.setState({
              answerLocked: true
            })
            notification.open({
              message: 'You answered correctly!',
              description: `Similarity score was ${axiosResponse.data.similarityScore }`,
              style: {
                backgroundColor: '#d4edda', // Light green background
                borderColor: '#c3e6cb',     // Green border
                color: '#155724',          // Green text
              },
            });
            this.setState({
              correctlyAnswered: this.state.correctlyAnswered.concat([this.state.generatedQuestion.word]),
              encountered: this.state.encountered.concat([this.state.generatedQuestion.word])
            })
          } else {
            this.setState({
              answerLocked: true
            })
            notification.open({
              message: 'You answered incorrectly...',
              description: `Similarity score was ${axiosResponse.data.similarityScore }`,
              style: {
                backgroundColor: '#f8d7da', // Light red background
                borderColor: '#f5c6cb',     // Red border
                color: '#721c24',          // Dark red text
              },
            });
            this.setState({
              encountered: this.state.encountered.concat([this.state.generatedQuestion.word])
            })
          }
        })
      }
    };

    // When there's an error
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
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

  constructTree = (rawData: any) => {
    // Step 1: Create the root node with the full sentence
    const rootNode = {
      name: rawData.map(item => item.Word).join(" "), // Combine all words to form the sentence
      attributes: {}, // Root doesn't have an accuracy score
      children: []
    };

    // Step 2: Process each word
    rawData.forEach(wordObj => {
      const wordNode = {
        name: wordObj.Word, // Word name
        attributes: {
          accuracyScore: wordObj.PronunciationAssessment?.AccuracyScore || null
        },
        children: [] // To hold syllables
      };

      // Step 3: Process syllables of the word
      if (wordObj.Syllables && Array.isArray(wordObj.Syllables)) {
        wordObj.Syllables.forEach(syllableObj => {
          const syllableNode = {
            name: syllableObj.Syllable, // Syllable name
            attributes: {
              accuracyScore:
                syllableObj.PronunciationAssessment?.AccuracyScore || null
            },
            children: [] // To hold phonemes
          };

          // Step 4: Process phonemes of the syllable
          if (wordObj.Phonemes && Array.isArray(wordObj.Phonemes)) {
            wordObj.Phonemes.forEach(phonemeObj => {
              if (
                phonemeObj.Offset >= syllableObj.Offset &&
                phonemeObj.Offset < syllableObj.Offset + syllableObj.Duration
              ) {
                syllableNode.children.push({
                  name: phonemeObj.Phoneme, // Phoneme name
                  attributes: {
                    accuracyScore:
                      phonemeObj.PronunciationAssessment?.AccuracyScore || null
                  }
                });
              }
            });
          }

          // Add syllable node to the word
          wordNode.children.push(syllableNode);
        });
      }

      // Add word node to the root
      rootNode.children.push(wordNode);
    });

    return rootNode;
  }

  submitMultipleChoiceAnswer = () => {
    if (this.state.currentlySelectedMultipleChoiceAnswer === this.state.generatedQuestion.definition) {
      notification.open({
        message: 'You answered correctly!',
        description: (
          <span>
            The definition of <strong>{this.state.generatedQuestion.word}</strong> is{' '}
            <strong>{this.state.generatedQuestion.definition}</strong>.
          </span>
        ),
        style: {
          backgroundColor: '#d4edda', // Light green background
          borderColor: '#c3e6cb',     // Green border
          color: '#155724',          // Green text
        },
      });
      this.setState({
        correctlyAnswered: this.state.correctlyAnswered.concat([this.state.generatedQuestion.word]),
        encountered: this.state.encountered.concat([this.state.generatedQuestion.word])
      })
    } else {
      notification.open({
        message: 'You answered incorrectly...',
        description: (
          <span>
            The definition of <strong>{this.state.generatedQuestion.word}</strong> is{' '}
            <strong>{this.state.generatedQuestion.definition}</strong>.
          </span>
        ),
        style: {
          backgroundColor: '#f8d7da', // Light red background
          borderColor: '#f5c6cb',     // Red border
          color: '#721c24',          // Dark red text
        },
      });
      this.setState({
        encountered: this.state.encountered.concat([this.state.generatedQuestion.word])
      })
    }
    this.setState({answerLocked: true})
  }


  componentDidMount() {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      this.setState({ voices: availableVoices });
      if (availableVoices.length > 0) {
        this.setState({ selectedVoiceName: availableVoices[0].name }); // Set default voice
      }
    };

    // Load voices and listen for changes (necessary for some browsers)
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    this.generateQuestion();

    // this.setState({initialRender: true})
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
              padding: this.state.siderCollapsed ? '8px' : '16px', // Adjust padding for collapsed state
              overflow: 'hidden', // Prevent overflow in collapsed state
              transition: 'all 0.3s', // Smooth animation
            }}
          >
            {/* Title changes when collapsed */}
            <h2
              style={{
                color: '#000',
                textAlign: 'center',
                marginBottom: this.state.siderCollapsed ? '8px' : '16px',
                fontSize: this.state.siderCollapsed ? '14px' : '18px',
                display: this.state.siderCollapsed ? 'none' : 'block', // Hide title when collapsed
                transition: 'all 0.3s', // Smooth transition
              }}
            >
              Results
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: this.state.siderCollapsed ? '8px' : '16px', // Smaller gap in collapsed state
                alignItems: this.state.siderCollapsed ? 'center' : 'stretch', // Center content when collapsed
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
                justifyContent: "space-between", // Spread items vertically
                height: "100vh", // Full viewport height
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
                    <>
                      {
                        this.state.generatingQuestion ? <Skeleton active paragraph={{ rows: 3 }} title={false} /> : <>
                          <Typography.Text style={{fontSize: '24px'}}>
                            In your own spoken words, what is the definition of{' '}
                            <Typography.Text strong style={{fontSize: '24px'}}>
                              {this.state.generatedQuestion.word}
                            </Typography.Text>?
                          </Typography.Text>
                          <br/>
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingTop: 20,
                          }}>
                            <Tooltip title={this.state.isRecording ? "Stop Recording" : "Start Recording"}>
                              <Button
                                shape="circle"
                                disabled={this.state.answerLocked}
                                style={{
                                  backgroundColor: this.state.isRecording ? "red" : "green",
                                  border: "none",
                                  width: "70px",
                                  height: "70px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  boxShadow: this.state.isRecording ? "0 0 20px rgba(255, 0, 0, 0.8)" : "none",
                                  animation: this.state.isRecording ? "pulse 1.5s infinite" : "none",
                                }}
                                onClick={() => {
                                  this.toggleRecording();
                                  if (this.state.isRecording) {
                                    this.stopRecognition();
                                  } else {
                                    this.collectFreeAnswer();
                                  }
                                }}
                              >
                                <AudioOutlined
                                  style={{
                                    fontSize: "32px",
                                    color: "white",
                                    animation: this.state.isRecording ? "icon-pulse 1.5s infinite" : "none",
                                  }}
                                />
                              </Button>
                            </Tooltip>
                          </div>
                          </>
                      }
                      <br/>
                    </>
                  ) : (
                    <></>
                  )}
                  {this.state.gameMode === "multipleChoice" && this.state.generatedQuestion ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                      {
                        this.state.generatingQuestion ? <Skeleton active paragraph={{ rows: 3 }} title={false} /> : <>
                          <Typography.Text style={{ fontSize: "24px", textAlign: "left", marginBottom: "10px" }}>
                            What is the correct definition of{" "}
                            <Typography.Text strong style={{ fontSize: "24px" }}>
                              {this.state.generatedQuestion.word}
                            </Typography.Text>?
                          </Typography.Text>

                          <div style={{ textAlign: "left" }}>
                            <Radio.Group
                              onChange={(radioChangeEvent) => {
                                this.setState({
                                  currentlySelectedMultipleChoiceAnswer: radioChangeEvent.target.value,
                                });
                              }}
                              value={this.state.currentlySelectedMultipleChoiceAnswer}
                            >
                              <Space direction={"vertical"}>
                                {this.state.multipleChoiceOptions.map((definition, index) => (
                                  <Radio key={index} value={definition} style={{ fontSize: "20px" }}>
                                    {definition}
                                  </Radio>
                                ))}
                              </Space>
                            </Radio.Group>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <Button
                              onClick={this.submitMultipleChoiceAnswer}
                              type="primary"
                              disabled={this.state.answerLocked}
                              style={{ fontSize: "18px", padding: "10px 20px" }}
                            >
                              Submit Answer
                            </Button>
                          </div>
                        </>
                      }
                    </div>
                  ) : (
                    <></>
                  )}
                  {this.state.gameMode === "verbatim" && this.state.generatedQuestion ? (
                    <>
                      {
                        this.state.generatingQuestion ? <Skeleton active paragraph={{ rows: 3 }} title={false} /> : <>
                          <Typography.Text style={{fontSize: '24px'}}>
                            Speak the following sentence verbatim:{' '}
                            <Typography.Text strong style={{fontSize: '24px'}}>
                              {this.state.generatedQuestion.definition}
                            </Typography.Text>
                          </Typography.Text>
                        </>
                      }
                      <br/>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingTop: 20,
                      }}>
                        <Tooltip title={this.state.isRecording ? "Stop Recording" : "Start Recording"}>
                          <Button
                            shape="circle"
                            disabled={this.state.answerLocked}
                            style={{
                              backgroundColor: this.state.isRecording ? "red" : "green",
                              border: "none",
                              width: "70px",
                              height: "70px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              boxShadow: this.state.isRecording ? "0 0 20px rgba(255, 0, 0, 0.8)" : "none",
                              animation: this.state.isRecording ? "pulse 1.5s infinite" : "none",
                            }}
                            onClick={() => {
                              this.toggleRecording();
                              if (this.state.isRecording) {
                                this.stopSpeechAssessment();
                              } else {
                                this.conductSpeechAssessment();
                              }
                            }}
                          >
                            <AudioOutlined
                              style={{
                                fontSize: "32px",
                                color: "white",
                                animation: this.state.isRecording ? "icon-pulse 1.5s infinite" : "none",
                              }}
                            />
                          </Button>
                        </Tooltip>
                      </div>
                      {this.state.pronunciationAssessmentResult ? (
                        <CustomTree
                          data={this.constructTree(this.state.pronunciationAssessmentResult.detailResult.Words)}/>
                      ) : (
                        <></>
                      )}
                    </>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
              <div
                style={{
                  textAlign: "right", // Align button to the right
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
              <Modal
                title="Hints"
                open={this.state.modalOpen}
                onOk={this.handleModalOk}
                onCancel={this.handleModalCancel}
                footer={null} // Remove default OK/Cancel buttons
                centered // Center the modal on the screen
                style={{ maxWidth: "500px" }} // Limit the modal width for better readability
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Dictate Button */}
                  <Button
                    type="primary"
                    onClick={() => {
                      this.state.gameMode === "verbatim"
                        ? this.tts(this.state.generatedQuestion.definition)
                        : this.tts(this.state.generatedQuestion.word);
                    }}
                    loading={this.state.generatingQuestion}
                    block // Make the button take the full width
                  >
                    {this.state.gameMode === "verbatim" ? "Dictate Definition" : "Dictate Word"}
                  </Button>

                  <div>
                    <Typography.Text strong>Select Dictation Voice:</Typography.Text>
                    <Select
                      style={{ width: "100%", marginTop: "8px" }}
                      value={this.state.selectedVoiceName}
                      onChange={(value) => {
                        this.setState({ selectedVoiceName: value });
                      }}
                      placeholder="Select a Voice"
                    >
                      {this.state.voices.map((voice) => (
                        <Option key={voice.name} value={voice.name}>
                          {voice.name} {voice.lang && `(${voice.lang})`}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <Button
                    type="primary"
                    onClick={this.revealHint}
                    loading={this.state.generatingQuestion}
                    block
                  >
                    Reveal Example Usage
                  </Button>

                  {this.state.generatedQuestion && (
                    <div>
                      <Typography.Text strong>Example Usages:</Typography.Text>
                      <div style={{ marginTop: "8px" }}>
                        {this.state.generatedQuestion.exampleUsages.map((usage, index) =>
                          this.state.hintsRevealed > index ? (
                            <Typography.Text key={index} style={{ display: "block", marginTop: "4px" }}>
                              - {usage}
                            </Typography.Text>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Modal>
            </Content>
          </Layout>
        </Layout>
      </div>
  );
  }
  }

  export default App;
