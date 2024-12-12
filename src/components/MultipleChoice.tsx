import React from "react";
import { Typography, Skeleton, Radio, Space, Button } from "antd";

const MultipleChoice = ({
                          generatingQuestion,
                          generatedQuestion,
                          multipleChoiceOptions,
                          currentlySelectedMultipleChoiceAnswer,
                          setCurrentlySelectedMultipleChoiceAnswer,
                          submitMultipleChoiceAnswer,
                          answerLocked,
                        }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {generatingQuestion ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : (
        <>
          <Typography.Text style={{ fontSize: "24px", textAlign: "left", marginBottom: "10px" }}>
            What is the correct definition of{" "}
            <Typography.Text strong style={{ fontSize: "24px" }}>
              {generatedQuestion.word}
            </Typography.Text>?
          </Typography.Text>

          <div style={{ textAlign: "left" }}>
            <Radio.Group
              onChange={(radioChangeEvent) =>
                setCurrentlySelectedMultipleChoiceAnswer(radioChangeEvent.target.value)
              }
              value={currentlySelectedMultipleChoiceAnswer}
            >
              <Space direction="vertical">
                {multipleChoiceOptions.map((definition, index) => (
                  <Radio key={index} value={definition} style={{ fontSize: "20px" }}>
                    {definition}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <div style={{ textAlign: "right" }}>
            <Button
              onClick={submitMultipleChoiceAnswer}
              type="primary"
              disabled={answerLocked}
              style={{ fontSize: "18px", padding: "10px 20px" }}
            >
              Submit Answer
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MultipleChoice;