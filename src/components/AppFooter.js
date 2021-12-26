import React from "react";
import { Row, Col } from "antd";
import { TextLoop } from "react-text-loop-next";

import { ExclamationCircleFilled, CheckCircleFilled } from "@ant-design/icons";

class AppFooter extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
      <Row gutter={8}>
        {this.props.connected && (
          <React.Fragment>
            <Col className="gutter-row">
              <CheckCircleFilled style={{ color: "#52c41a" }} />
            </Col>
            <Col className="gutter-row">{this.props.portConnected}</Col>
          </React.Fragment>
        )}
        {!this.props.connected && (
          <React.Fragment>
            <Col className="gutter-row">
              <ExclamationCircleFilled style={{ color: "#a61d24" }} />
            </Col>
            <Col className="gutter-row">
            <TextLoop noWrap>
              <div>{this.props.error.message}</div>
              <div>{this.props.error.details}</div>
            </TextLoop>
          </Col>
          </React.Fragment>
        )}

        <Col flex="auto" style={{ textAlign: "right" }}>
          {this.props.path}
        </Col>
      </Row>
    );
  }
}

export default AppFooter;
