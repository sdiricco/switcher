import React from "react";
import Marquee from "react-fast-marquee";
import { Alert, Typography } from "antd";
import { TextLoop } from 'react-text-loop-next';

class AppFooter extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
        <Alert
        className="alert"
        type="error"
        banner
        message="Error"
        description={
          <TextLoop mask noWrap={false}>
            <div>{this.props.error.message}</div>
            <div>{this.props.error.details}</div>
          </TextLoop>
        }
        closable
      />
    );
  }
}

export default AppFooter;
