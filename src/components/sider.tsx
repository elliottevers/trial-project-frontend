import React, { useState } from 'react';
import { Layout, Row, Col, Card } from 'antd';
import App from "../App";

const { Sider, Content } = Layout;

const CollapsibleSiderResults = ({correctlyAnswered, encountered}) => {
  const [collapsed, setCollapsed] = useState(false);

  const [state, setState] = useState({
    correctlyAnswered,
    encountered,
  });

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapse}
        width={300}
        style={{ background: '#fff', padding: '16px' }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Card title="Correctly Guessed Words" bordered={true}>
              {state.correctlyAnswered.map((word, index) => (
                <p key={`guessed-${index}`}>{word}</p>
              ))}
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card title="Encountered Words" bordered={true}>
              {state.encountered.map((word, index) => (
                <p key={`encountered-${index}`}>{word}</p>
              ))}
            </Card>
          </Col>
        </Row>
      </Sider>
      <Layout>
        <Content style={{ padding: '16px', background: '#f0f2f5' }}>
          {/*<button onClick={toggleCollapse} style={{ marginBottom: '16px' }}>*/}
          {/*  {collapsed ? 'Expand Sider' : 'Collapse Sider'}*/}
          {/*</button>*/}
          {/*<div>*/}
          {/*  <h1>Main Content Area</h1>*/}
          {/*  <p>This is the main content area outside the collapsible sider.</p>*/}
          {/*</div>*/}
          <App />
        </Content>
      </Layout>
    </Layout>
  );
};

export default CollapsibleSiderResults;