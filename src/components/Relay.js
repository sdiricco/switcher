import React from "react";
import {
  Switch,
  Typography,
  Input,
  Row,
  Col,
} from "antd";

class Relay extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
      <Row wrap={false} style={{minWidth: "-webkit-fill-available"}}>
        < Col className="gutter-row">
          {this.props.relays.map((relay, idx) => {
            const index = (idx + 1).toString().padStart(2, "0");
            return (
              <Row key={`r_${index}`} gutter={8} wrap={false}>
                <Col className="gutter-row">
                  <Switch
                    checked={relay.state}
                    disabled={!this.props.connected}
                    onChange={(e) => {
                      this.props.onClickSwitch(relay, idx);
                    }}
                  />
                </Col>
                <Col className="gutter-row">
                  <code>{index}</code>
                </Col>
                <Col className="gutter-row">
                  <Input
                    style={{minWidth: "200px"}}
                    value={relay.label}
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
