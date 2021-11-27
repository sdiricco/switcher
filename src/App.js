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
const OPEN = 0;
const CLOSE = 1;


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
    this.onClickConnect = this.onClickConnect.bind(this)
    this.onRlyError = this.onRlyError.bind(this);
    this.onRlyUpdate = this.onRlyUpdate.bind(this);
  }

  async onRlyError(event, e, rlyState) {
    console.log(e);
    this.setState({
      error: true,
      errorTxt: e.message,
      connected: rlyState.connected,
      port: rlyState.port,
      relays: rlyState.relays,
    });
  }

  onRlyUpdate(event, rlyState) {
    console.log(rlyState);
    this.setState({
      connected: rlyState.connected,
      port: rlyState.port,
      relays: rlyState.relays,
    });
  }

  async onClickConnect(){
    const res = await this.connect();
    console.log(res);
  }

  async onClickSwitch(el, idx) {
    if (this.state.isbusy) {
      return;
    }
    this.setState({
      isbusy: true,
    });
    const isOpen = Boolean(el.state);
    const res = await ipcRenderer.invoke("relayjs-write", idx, Number(!isOpen));
    console.log(res)
    this.setState({
      isbusy: false,
    });
  }

  async connect(){
    const res = await ipcRenderer.invoke("relayjs-connect");
    console.log(res)
  }

  async disconnect(){
    const res = await ipcRenderer.invoke("relayjs-disconnect");
    console.log(res)

  }

  async componentDidMount() {
    this.setState({
      loading: true,
    });
    ipcRenderer.off("relayjs-error", this.onRlyError);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    ipcRenderer.on("relayjs-error", this.onRlyError);
    ipcRenderer.on("relayjs-updatestate", this.onRlyUpdate);
    await this.connect();
    this.setState({
      loading: false,
    });
  }

  async componentWillUnmount(){
    ipcRenderer.off("relayjs-error", this.onRlyError);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
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
          closable
          afterClose={()=>{
            this.setState({
              error: false
            })
          }}
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
    if (this.state.relays && this.state.relays.length) {
      relays = this.state.relays.map((el, idx) => {
        return (
          <div key={`div_${idx}`} style={{ textAlign: "center" }}>
            <Typography key={`ty__${idx}`} style={{ color: "#fefefe" }}>{idx}</Typography>
            <Switch
              checked={el.value}
              disabled={!this.state.connected || this.state.isbusy}
              style={{ margin: "4px" }}
              key={`sw__${idx}`}
              onChange={async () => {
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
            <ExclamationCircleFilled style={{ color: "#a61d24" }} />
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
          <Button onClick={this.onClickConnect}>connect</Button>
          {spinner}
          <div className="relayContainer">{relays}</div>
          {alert}
        </Content>
        <Footer className="footer">{footer}</Footer>
      </Layout>
    );
  }
}

export default App;
