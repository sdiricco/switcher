import React from "react";
import { Switch, Typography, Input, Row, Col } from "antd";

class Relay extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    let index = this.props.index !== undefined ? this.props.index : "";
    return (
      <Row gutter={8}>
        <Col className="gutter-row">
          <Switch {...this.props.switchProps} />
        </Col>
        <Col className="gutter-row">
          <Typography {...this.props.indexProps}>{index}</Typography>
        </Col>
        <Col className="gutter-row">
          <Input {...this.props.inputLabelProps} />
        </Col>
      </Row>
    );
  }
}

export default Relay;
