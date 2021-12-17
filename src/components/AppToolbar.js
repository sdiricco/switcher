import React from "react";
import { Button, Row, Col, InputNumber } from "antd";
import {
  ApiOutlined,
  DisconnectOutlined,
  SyncOutlined,
} from "@ant-design/icons";

const MAX_INT = 1000;
const MIN_INT = 0;
const MAX_RLY_COUNT = 64;
const MIN_RLY_COUNT = 1;
const DEFAULT_RLY_COUNT = 8;

class AppToolbar extends React.Component {
  constructor(props) {
    super(props);
    const rlyCount = props.rlyCount ? rlyCount : undefined
    this.props = props;
    this.state = {
      rlyCount: rlyCount,
      errorRlyCount: false,
    };
    this.onChangeRlyCount = this.onChangeRlyCount.bind(this);
    this.onClickReconnect = this.onClickReconnect.bind(this);
  }

  onChangeRlyCount(value) {
    let errorRlyCount = false;
    if (value < MIN_RLY_COUNT || value > MAX_RLY_COUNT) {
      errorRlyCount = true;
    }
    this.setState({
      rlyCount: value,
      errorRlyCount: errorRlyCount,
    });
  }

  onClickReconnect() {
    if (
      this.state.rlyCount < MIN_RLY_COUNT ||
      this.state.rlyCount > MAX_RLY_COUNT
    ) {
      return;
    }
    this.props.onClickReconnect(this.state.rlyCount);
  }

  componentDidUpdate(prevProps){
    if (prevProps.rlyCount !== this.props.rlyCount) {
      this.setState({
        rlyCount: this.props.rlyCount
      })
    }
  }

  render() {
    return (
      <Row>
        {!this.props.connected && (
          <Col className="gutter-row">
            <Button
              className="buttonStyle"
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
              className="buttonStyle"
              type="text"
              onClick={this.props.onClickDisconnect}
            >
              <DisconnectOutlined />
              Disconnect
            </Button>
          </Col>
        )}
        <div className="verticalDivider"></div>
        <Col className="gutter-row">
          <Button
            className="buttonStyle"
            type="text"
            disabled={this.state.errorRlyCount || !this.state.rlyCount}
            onClick={this.onClickReconnect}
          >
            <SyncOutlined />
          </Button>
        </Col>
        <Col className="gutter-row">
          <InputNumber
            min={MIN_INT}
            max={MAX_INT}
            value={this.state.rlyCount}
            onChange={this.onChangeRlyCount}
            style={{
              color: this.state.errorRlyCount ? "red" : "white",
            }}
          />
        </Col>
      </Row>
    );
  }
}

export default AppToolbar;
