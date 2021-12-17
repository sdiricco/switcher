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

class Relay extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
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
    );
  }
}

export default Relay;
