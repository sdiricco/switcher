import React from "react";
import { Row, Col, Cascader, Button } from "antd";

class AppHeader extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
      <Row gutter={8}>
        {this.props.entries.map((entry) => {
          let menu = entry.menu.map((option) => {
            option.label = <div className="menu-entries">{option.label}</div>;
            return option;
          });
          return (
            <Col className="gutter-row">
              <Cascader
                style={{ width: "300px" }}
                bordered={false}
                onChange={this.props.onChange}
                options={menu}
              >
                <Button size="small" type="text">
                  {entry.label}
                </Button>
              </Cascader>
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default AppHeader;
