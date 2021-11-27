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
      connected: false,
      port: "",
      loading: false,
      error: false,
      errorTxt: "",
      relays: [],
      isbusy: false,
    };
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onClickSwitch = this.onClickSwitch.bind(this);
    this.onRlyError = this.onRlyError.bind(this);
    this.onRlyUpdate = this.onRlyUpdate.bind(this);
  }

  onRlyError(event, error) {
    console.log(error);
    this.setState({
      error: true,
      errorTxt: error,
    });
  }

  onRlyUpdate(event, state) {
    console.log(state);
    this.setState({
      connected: state.connected,
      port: state.port,
      relays: state.relays
    });
  }

  async onClickSwitch(el, idx) {
    if (this.state.isbusy) {
      return;
    }
    this.setState({
      isbusy: true,
    });
    const value = Number(!el.state);
    await ipcRenderer.invoke("relayjs-write", idx, value);
    this.setState({
      isbusy: false,
    });
  }

  async connect(){
    await ipcRenderer.invoke("relayjs-connect");
    ipcRenderer.on("relayjs-error", this.onRlyError);
    ipcRenderer.on("relayjs-updatestate", this.onRlyUpdate);
  }

  async disconnect(){
    await ipcRenderer.invoke("relayjs-disconnect")
    ipcRenderer.off("relayjs-error", this.onRlyError);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
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
    if (!this.state.error && this.state.relays && this.state.relays.length) {
      relays = this.state.relays.map((el, idx) => {
        return (
          <div style={{ textAlign: "center" }}>
            <Typography style={{ color: "#fefefe" }}>{idx}</Typography>
            <Switch
              checked={el.value}
              disabled={!this.state.connected || this.state.isbusy}
              style={{ margin: "4px" }}
              key={`sw__${idx}`}
              onChange={async () => {
                console.log("on change");
                await this.onClickSwitch(el, idx);
              }}
            ></Switch>
          </div>
        );
      });
    }

    //state footer component
    let footer = null;
    if (this.state.connected) {
      footer = (
        <Row gutter={8}>
          <Col className="gutter-row">
            <CheckCircleFilled style={{ color: "#52c41a" }} />
          </Col>
          <Col className="gutter-row">
            <Typography>{this.state.port}</Typography>
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
