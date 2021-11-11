import React from "react";
import { Button, Switch, Typography, Input, Layout, Row, Col } from "antd";
import {
  ExclamationCirclimport,
  CheckCircleFilled,
} from '@ant-design/icons'

//<CheckCircleFilled />

import "./App.less";

const { Header, Footer, Sider, Content } = Layout;
const { ipcRenderer } = window.require("electron");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      info: {},
      isConnected: false,
      relays: [],
      isbusy: false,
    };
    this.onClickSwitch = this.onClickSwitch.bind(this);
    this.onRelayJsError = this.onRelayJsError.bind(this);
    this.onUpdateRelayJsState = this.onUpdateRelayJsState.bind(this);
  }

  onRelayJsError(event, data) {
    console.log(data);
  }

  onUpdateRelayJsState(event, data) {
    console.log(data);
    this.setState({
      info: data.info,
      isConnected: data.info.connected,
      relays: data.relays,
    });
  }

  async onClickSwitch(el) {
    this.setState({ isbusy: true });
    let relays = this.state.relays;
    const value = Number(!el.value);
    await ipcRenderer.invoke("set-relay", el.pin, value);
    const __relays = relays.map((__el) => {
      if (__el.pin === el.pin) {
        return {
          pin: __el.pin,
          type: __el.type,
          value: value,
        };
      }
    });
    this.setState({
      relays: relays,
      isbusy: false,
    });
  }

  async componentDidMount() {
    await ipcRenderer.invoke("connect");
    ipcRenderer.on("relayjs-error", this.onRelayJsError);
    ipcRenderer.on("update-relayjs-state", this.onUpdateRelayJsState);
  }

  render() {
    return (
        <Layout className="layout">
          <Content className="content">
            <div className="relayContainer">
              {this.state.relays.map((el) => {
                return (
                  <div style={{ textAlign: "center" }}>
                    <Typography style={{ color: "#fefefe" }}>
                      {el.pin}
                    </Typography>
                    <Switch
                      checked={el.value}
                      disabled={!this.state.isConnected || this.state.isbusy}
                      style={{ margin: "4px" }}
                      key={`sw__${el.pin}`}
                      onChange={() => {
                        this.onClickSwitch(el);
                      }}
                    ></Switch>
                  </div>
                );
              })}
            </div>
          </Content>
          <Footer className="footer">
            <Row gutter={8}>
              <Col className="gutter-row">
                <CheckCircleFilled style={{color: "#8bbb11"}}/>
              </Col>
              <Col className="gutter-row">
                <Typography>{this.state.info.port}</Typography>
              </Col>
            </Row>
          </Footer>
        </Layout>
    );
  }
}

export default App;
