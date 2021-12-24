import React from "react";
import { Layout, Empty } from "antd";
import logo from'./assets/icons/Disconnected-595b40b65ba036ed117d3f4c.svg';

import "./App.less";

import AppFooter from "./components/AppFooter";
import AppToolbar from "./components/AppToolbar";
import AppAlert from "./components/AppAlert";
import Relay from "./components/Relay";

const { Header, Footer, Content } = Layout;

class AppRender extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    const showRelays = this.props.connected;
    const showErrorBox =
      !this.props.loading &&
      !this.props.connected &&
      this.props.eMessage !== "";
    const showEmptyBox =
      !this.props.loading &&
      !this.props.connected &&
      this.props.eMessage === "";

    return (
      <Layout className="layout">
        <Header className={"header"}>
          <AppToolbar {...this.props} />
        </Header>
        <Content className="content">
          {showRelays && <Relay {...this.props} />}
          {showErrorBox && <AppAlert {...this.props} />}
          {showEmptyBox && <img src={logo} height={150} width={150}/>}
        </Content>
        <Footer className="footer">
          <AppFooter {...this.props} />
        </Footer>
      </Layout>
    );
  }
}

export default AppRender;
