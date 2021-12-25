import React from "react";
import logo from "../assets/icons/Disconnected-595b40b65ba036ed117d3f4c.svg";
import { Empty } from "antd";


class AppDisconnected extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
      <Empty
        image={logo}
        imageStyle={{
          height: 150,
        }}
        description="Disconnected"
      />
    );
  }
}

export default AppDisconnected;
