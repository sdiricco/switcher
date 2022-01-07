import React from "react";
import { Button, Row, Col, InputNumber } from "antd";
import {
  ApiOutlined,
  DisconnectOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import styles from "./AppToolbar.module.css"

const MAX_INT = 1000;
const MIN_INT = 0;
const MAX_RLY_COUNT = 64;
const MIN_RLY_COUNT = 1;

class AppToolbar extends React.Component {
  constructor(props) {
    super(props);
    const rlyCount = props.rlyCountSelected ? props.rlyCountSelected : undefined;
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

  componentDidUpdate(prevProps) {
    if (prevProps.rlyCountSelected !== this.props.rlyCountSelected) {
      this.setState({
        rlyCount: this.props.rlyCountSelected,
      });
    }
  }

  render() {
    return (
      <Row wrap={false}>
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
        <Col flex="auto" className="gutter-row">
          <Row className={styles.dxButtonGroup} wrap={false}>
            <Col className="gutter-row">
              <Button
                className="buttonStyle"
                type="text"
                disabled={this.state.errorRlyCount || !this.state.rlyCount}
                onClick={this.onClickReconnect}
              >
                <SyncOutlined /> Update relay count
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
        </Col>
      </Row>
    );
  }
}

export default AppToolbar;
