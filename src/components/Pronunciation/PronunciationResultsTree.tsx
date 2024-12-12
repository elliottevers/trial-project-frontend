import React from "react";
import "./PronunciationResultsTree.css";


const TreeNode = ({ node }) => {
  const getBackgroundColor = (accuracyScore) => {
    if (accuracyScore === null || accuracyScore === undefined) {
      return "#ccc";
    }
    const green = Math.round((accuracyScore / 100) * 255);
    const red = 255 - green;
    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <div className="tree-node">
      <div className="node-content">
        {node.attributes?.accuracyScore !== undefined && (
          <div className="accuracy-score">{node.attributes.accuracyScore}%</div>
        )}
        <div
          className="node-box"
          style={{
            backgroundColor: getBackgroundColor(node.attributes?.accuracyScore),
          }}
        >
          {node.name}
        </div>
      </div>

      {node.children && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <TreeNode key={index} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const WordGroup = ({ wordNode }) => {
  return (
    <div className="word-group">
      <TreeNode node={wordNode} />
    </div>
  );
};

const PronunciationResultsTree = ({ data }) => {
  return (
    <div className="tree-container">
      <div className="tree">
          <div className="sentence-label">
            <h2>Pronunciation Test Results:</h2>
            <div className="sentence-text" style={{paddingBottom: 20}}>{data.name}</div>
          </div>
        <div className="tree-levels">
          <div className="words-container">
            {data.children.map((word, index) => (
              <WordGroup key={index} wordNode={word} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const constructTree = (rawData: any) => {
  const rootNode = {
    name: rawData.map(item => item.Word).join(" "),
    attributes: {},
    children: []
  };

  rawData.forEach(wordObj => {
    const wordNode = {
      name: wordObj.Word,
      attributes: {
        accuracyScore: wordObj.PronunciationAssessment?.AccuracyScore || null
      },
      children: []
    };

    if (wordObj.Syllables && Array.isArray(wordObj.Syllables)) {
      wordObj.Syllables.forEach(syllableObj => {
        const syllableNode = {
          name: syllableObj.Syllable,
          attributes: {
            accuracyScore:
              syllableObj.PronunciationAssessment?.AccuracyScore || null
          },
          children: []
        };

        if (wordObj.Phonemes && Array.isArray(wordObj.Phonemes)) {
          wordObj.Phonemes.forEach(phonemeObj => {
            if (
              phonemeObj.Offset >= syllableObj.Offset &&
              phonemeObj.Offset < syllableObj.Offset + syllableObj.Duration
            ) {
              syllableNode.children.push({
                name: phonemeObj.Phoneme,
                attributes: {
                  accuracyScore:
                    phonemeObj.PronunciationAssessment?.AccuracyScore || null
                }
              });
            }
          });
        }

        wordNode.children.push(syllableNode);
      });
    }

    rootNode.children.push(wordNode);
  });

  return rootNode;
}

export default PronunciationResultsTree;
