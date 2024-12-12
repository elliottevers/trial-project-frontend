import React from "react";
import { Typography, Skeleton, Tooltip, Button } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import PronunciationResultsTree, {constructTree} from "./PronunciationResultsTree"; // Adjust the path if necessary

const PronunciationTest = ({
                    generatingQuestion,
                    generatedQuestion,
                    isRecording,
                    answerLocked,
                    toggleRecording,
                    stopSpeechAssessment,
                    conductSpeechAssessment,
                    pronunciationAssessmentResult,
                  }) => {
  return (
    <>
      {generatingQuestion ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : (
        <>
          <Typography.Text style={{ fontSize: "24px" }}>
            Speak the following sentence verbatim:{" "}
            <Typography.Text strong style={{ fontSize: "24px" }}>
              {generatedQuestion.definition}
            </Typography.Text>
          </Typography.Text>
        </>
      )}
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
                stopSpeechAssessment();
              } else {
                conductSpeechAssessment();
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
      {pronunciationAssessmentResult ? (
        <PronunciationResultsTree
          data={constructTree(
            pronunciationAssessmentResult.detailResult.Words
          )}
        />
      ) : null}
    </>
  );
};

export default PronunciationTest;