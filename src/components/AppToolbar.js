import React from "react";
import { Button, Row, Col } from "antd";
import { ApiOutlined, DisconnectOutlined } from "@ant-design/icons";

class AppToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
      <Row gutter={8}>
        {!this.props.connected && (
          <Col className="gutter-row">
            <Button
              type="text"
              onClick={this.props.onClickConnect}
            >
              <ApiOutlined />
              Connect
            </Button>
          </Col>
        )}
        {this.props.connected && (
          <Col className="gutter-row">
            <Button
              type="text"
              onClick={this.props.onClickDisconnect}
            >
              <DisconnectOutlined />
              Disconnect
            </Button>
          </Col>
        )}
      </Row>
    );
  }
}

export default AppToolbar;
