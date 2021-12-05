import React from "react";
import Marquee from "react-fast-marquee";
import { Layout, Alert } from "antd";

import "./App.less";

import Relay from "./components/Relay";
import AppFooter from "./components/AppFooter";
import AppToolbar from "./components/AppToolbar";

const { Header, Footer, Content } = Layout;

class AppRender extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  render() {
    return (
      <Layout className="layout">
        <Header className={"header"}>
          <AppToolbar {...this.props} />
        </Header>
        <Content className="content">
          {this.props.connected&& (
            <Relay {...this.props} />
          )}
          {!this.props.connected && !this.props.loading && (
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
          )}
        </Content>
        <Footer className="footer">
          <AppFooter {...this.props} />
        </Footer>
      </Layout>
    );
  }
}

export default AppRender;
