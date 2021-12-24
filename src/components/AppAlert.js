import React from "react";
import Marquee from "react-fast-marquee";
import { Alert } from "antd";

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
          <Marquee pauseOnHover gradient={false}>
            {this.props.eMessage}
          </Marquee>
        }
        closable
      />
    );
  }
}

export default AppFooter;
