import React from "react";
import { Typography, Skeleton, Tooltip, Button } from "antd";
import { AudioOutlined } from "@ant-design/icons";

const FreeAnswer = ({
                      generatingQuestion,
                      generatedQuestion,
                      isRecording,
                      answerLocked,
                      toggleRecording,
                      stopRecognition,
                      collectFreeAnswer,
                    }) => {
  return (
    <>
      {generatingQuestion ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : (
        <>
          <Typography.Text style={{ fontSize: "24px" }}>
            In your own spoken words, what is the definition of{" "}
            <Typography.Text strong style={{ fontSize: "24px" }}>
              {generatedQuestion.word}
            </Typography.Text>?
          </Typography.Text>
          <br />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 20,
            }}
          >
            <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
              <Button
                shape="circle"
                disabled={answerLocked}
                style={{
                  backgroundColor: isRecording ? "red" : "green",
                  border: "none",
                  width: "70px",
                  height: "70px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: isRecording
                    ? "0 0 20px rgba(255, 0, 0, 0.8)"
                    : "none",
                  animation: isRecording ? "pulse 1.5s infinite" : "none",
                }}
                onClick={() => {
                  toggleRecording();
                  if (isRecording) {
                    stopRecognition();
                  } else {
                    collectFreeAnswer();
                  }
                }}
              >
                <AudioOutlined
                  style={{
                    fontSize: "32px",
                    color: "white",
                    animation: isRecording ? "icon-pulse 1.5s infinite" : "none",
                  }}
                />
              </Button>
            </Tooltip>
          </div>
        </>
      )}
      <br />
    </>
  );
};

export default FreeAnswer;