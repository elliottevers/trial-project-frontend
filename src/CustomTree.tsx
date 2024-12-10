import React, {useEffect, useState} from "react";
import "./CustomTree.css";


// Recursive TreeNode Component
const TreeNode = ({ node }) => {
  // Function to calculate the background color based on accuracyScore
  const getBackgroundColor = (accuracyScore) => {
    if (accuracyScore === null || accuracyScore === undefined) {
      return "#ccc"; // Gray for nodes without scores
    }
    const green = Math.round((accuracyScore / 100) * 255);
    const red = 255 - green;
    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <div className="tree-node">
      <div className="node-content">
        {/* Accuracy Score */}
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

      {/* Render child nodes */}
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

const CustomTree = ({ data }) => {
  return (
    <div className="tree-container">
      {/* Tree Visualization */}
      <div className="tree">
        {/* Render Sentence Level */}
        {/*<div className="tree-sentence">*/}
          <div className="sentence-label">
            <h2>Pronunciation Test Results:</h2>
            <div className="sentence-text" style={{paddingBottom: 20}}>{data.name}</div>
          </div>
        {/*</div>*/}
        {/* Render Words, Syllables, and Phonemes */}
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

export default CustomTree;
