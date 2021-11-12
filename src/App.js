import React from "react";
import Marquee from "react-fast-marquee";
import {
  Button,
  Switch,
  Typography,
  Input,
  Layout,
  Row,
  Col,
  Spin,
  Alert,
} from "antd";
import {
  ExclamationCircleFilled,
  CheckCircleFilled,
  LoadingOutlined,
} from "@ant-design/icons";

import "./App.less";

const { Header, Footer, Sider, Content } = Layout;
const { ipcRenderer } = window.require("electron");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      info: {
        port: "",
        connected: false,
      },
      loading: false,
      error: false,
      errorTxt: "",
      relays: [],
      isbusy: false,
    };
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onClickSwitch = this.onClickSwitch.bind(this);
    this.onRelayJsError = this.onRelayJsError.bind(this);
    this.onUpdateRelayJsState = this.onUpdateRelayJsState.bind(this);
  }

  onRelayJsError(event, error, data) {
    console.log(error);
    console.log(data);
    this.setState({
      info: data.info,
      relays: data.relays,
      error: true,
      errorTxt: error.message,
    });
  }

  onUpdateRelayJsState(event, data) {
    console.log(data);
    this.setState({
      info: data.info,
      relays: data.relays,
    });
  }

  async onClickSwitch(el) {
    if (this.state.isbusy) {
      return;
    }
    this.setState({
      isbusy: true,
    });
    let relays = this.state.relays;
    const value = Number(!el.value);
    await ipcRenderer.invoke("set-relay", el.pin, value);
    const idx = relays.findIndex((__el) => __el.pin === el.pin);
    if (idx > -1) {
      relays[idx].value = value;
    }
    this.setState({
      relays: relays,
      isbusy: false,
    });
  }

  async connect(){
    await ipcRenderer.invoke("connect");
    ipcRenderer.on("relayjs-error", this.onRelayJsError);
    ipcRenderer.on("update-relayjs-state", this.onUpdateRelayJsState);
  }

  async disconnect(){
    ipcRenderer.off("relayjs-error", this.onRelayJsError);
    ipcRenderer.off("update-relayjs-state", this.onUpdateRelayJsState);
  }

  async componentDidMount() {
    this.setState({
      loading: true,
    });
    await this.connect();
    this.setState({
      loading: false,
    });
  }

  async componentWillUnmount(){
    await this.disconnect();
  }

  render() {
    //Alert component
    let alert = null;
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    if (this.state.error) {
      alert = (
        <Alert
          type="error"
          banner
          message={
            <Marquee pauseOnHover gradient={false}>
              {this.state.errorTxt}
            </Marquee>
          }
        />
      );
    }

    //Spin component
    let spinner = null;
    if (this.state.loading) {
      spinner = <Spin indicator={antIcon} tip="Connecting..." />;
    }

    //Relay component
    let relays = null;
    if (!this.state.error) {
      relays = this.state.relays.map((el) => {
        return (
          <div style={{ textAlign: "center" }}>
            <Typography style={{ color: "#fefefe" }}>{el.pin}</Typography>
            <Switch
              checked={el.value}
              disabled={!this.state.info.connected || this.state.isbusy}
              style={{ margin: "4px" }}
              key={`sw__${el.pin}`}
              onChange={async () => {
                console.log("on change");
                await this.onClickSwitch(el);
              }}
            ></Switch>
          </div>
        );
      });
    }

    //state footer component
    let footer = null;
    if (this.state.info.connected) {
      footer = (
        <Row gutter={8}>
          <Col className="gutter-row">
            <CheckCircleFilled style={{ color: "#52c41a" }} />
          </Col>
          <Col className="gutter-row">
            <Typography>{this.state.info.port}</Typography>
          </Col>
        </Row>
      );
    }
    else{
      footer = (
        <Row gutter={8}>
          <Col className="gutter-row">
            <ExclamationCircleFilled style={{ color: "#eb2f96" }} />
          </Col>
          <Col className="gutter-row">
            <Typography>Disconnected</Typography>
          </Col>
        </Row>
      );
    }

    return (
      <Layout className="layout">
        <Content className="content">
          <Button onClick={this.connect}>connect</Button>
          {spinner}
          <div className="relayContainer">{relays}</div>
          {alert}
        </Content>
        <Footer className="footer">{footer}

        </Footer>
      </Layout>
    );
  }
}

export default App;
