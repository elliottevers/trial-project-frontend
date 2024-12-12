import React from "react";
import { Modal, Button, Select, Typography } from "antd";

const { Option } = Select;

const HintsModal = ({
                      modalOpen,
                      handleModalOk,
                      handleModalCancel,
                      gameMode,
                      tts,
                      generatedQuestion,
                      generatingQuestion,
                      selectedVoiceName,
                      setSelectedVoiceName,
                      voices,
                      revealHint,
                      hintsRevealed,
                    }) => {
  return (
    <Modal
      title="Hints"
      open={modalOpen}
      onOk={handleModalOk}
      onCancel={handleModalCancel}
      footer={null}
      centered
      style={{ maxWidth: "500px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Button
          type="primary"
          onClick={() => {
            if (generatedQuestion) {
              gameMode === "verbatim"
                ? tts(generatedQuestion.definition)
                : tts(generatedQuestion.word);
            }
          }}
          loading={generatingQuestion}
          block
        >
          {gameMode === "verbatim" ? "Dictate Definition" : "Dictate Word"}
        </Button>

        <div>
          <Typography.Text strong>Select Dictation Voice:</Typography.Text>
          <Select
            style={{ width: "100%", marginTop: "8px" }}
            value={selectedVoiceName}
            onChange={(value) => setSelectedVoiceName(value)}
            placeholder="Select a Voice"
          >
            {voices.map((voice) => (
              <Option key={voice.name} value={voice.name}>
                {voice.name} {voice.lang && `(${voice.lang})`}
              </Option>
            ))}
          </Select>
        </div>

        <Button
          type="primary"
          onClick={revealHint}
          loading={generatingQuestion}
          block
        >
          Reveal Example Usage
        </Button>

        {generatedQuestion && (
          <div>
            <Typography.Text strong>Example Usages:</Typography.Text>
            <div style={{ marginTop: "8px" }}>
              {generatedQuestion.exampleUsages.map((usage, index) =>
                hintsRevealed > index ? (
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
  );
};

export default HintsModal;