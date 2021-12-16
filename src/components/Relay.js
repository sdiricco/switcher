import React from "react";
import {
  Switch,
  Typography,
  Input,
  Row,
  Col,
  InputNumber,
  Button,
  Divider,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import styles from "./Relay.module.css";

const MAX_INT = 1000;
const MIN_INT = 0;
const MAX_RLY_COUNT = 64;
const MIN_RLY_COUNT = 1;
const DEFAULT_RLY_COUNT = 8;

class Relay extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      rlyCount: DEFAULT_RLY_COUNT,
      errorRlyCount: false,
    };
    this.onChangeRlyCount = this.onChangeRlyCount.bind(this);
    this.onClickSetRlyCount = this.onClickSetRlyCount.bind(this);
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

  onClickSetRlyCount(){
    if (this.state.rlyCount < MIN_RLY_COUNT || this.state.rlyCount > MAX_RLY_COUNT) {
      return;
    }
    this.props.onClickSetRlyCount(this.state.rlyCount);
  }

  render() {
    return (
      <div className={styles.container}>
        <Row className={styles.inputContainer} gutter={8} align="middle">
          <Col>
            <Typography> Relays</Typography>
          </Col>
          <Col>
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
          <Col>
            <Button className={styles.buttonStyle} onClick={this.onClickSetRlyCount}>
              <CheckOutlined />
            </Button>
          </Col>
        </Row>
        <Divider />
        <Row>
          <Col className="gutter-row">
            {this.props.relays.map((relay, idx) => {
              const index = (idx + 1).toString().padStart(2, "0");
              return (
                <Row gutter={8}>
                  <Col className="gutter-row">
                    <Switch
                      checked={relay.value}
                      disabled={!this.props.connected}
                      onChange={(e) => {
                        this.props.onClickSwitch(relay, idx);
                      }}
                    />
                  </Col>
                  <Col className="gutter-row">
                    <Typography>{index}</Typography>
                  </Col>
                  <Col className="gutter-row">
                    <Input
                      value={this.props.labels[idx]}
                      placeholder="label"
                      onChange={(e) => {
                        this.props.onChangeLabel(e, idx);
                      }}
                    />
                  </Col>
                </Row>
              );
            })}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Relay;
