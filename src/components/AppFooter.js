import React from "react";
import { Row, Col } from "antd";

class AppFooter extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    const elems = this.props.elems || [];
    return (
      <Row gutter={8}>
        {elems.map((entry) => {
          if (entry.content && !entry.hidden) {
            return <Col className="gutter-row">{entry.content}</Col>;
          }
          else{
            return null
          }
        })}
      </Row>
    );
  }
}

export default AppFooter;
