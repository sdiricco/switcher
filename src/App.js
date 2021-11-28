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
  ApiOutlined,
  DisconnectOutlined,
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
      eMessage: "",
      relays: [],
      isbusy: false,
    };
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onClickSwitch = this.onClickSwitch.bind(this);
    this.onClickConnect = this.onClickConnect.bind(this);
    this.onClickDisconnect = this.onClickDisconnect.bind(this);
    this.onRlyUpdate = this.onRlyUpdate.bind(this);
  }

  onRlyUpdate(event, e, rlyState) {
    console.log(e);
    console.log(rlyState);
    this.setState({
      eMessage: e.message,
      connected: rlyState.connected,
      port: rlyState.port,
      relays: rlyState.relays,
    });
  }

  async onClickConnect() {
    console.log("clicked connect");
    const res = await this.connect();
    console.log(res);
  }

  async onClickDisconnect() {
    console.log("clicked disconnect");
    const res = await this.disconnect();
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
    console.log(res);
    this.setState({
      isbusy: false,
    });
  }

  async connect() {
    this.setState({
      loading: true,
    });
    const res = await ipcRenderer.invoke("relayjs-connect");
    console.log(res);
    this.setState({
      loading: false,
    });
  }

  async disconnect() {
    const res = await ipcRenderer.invoke("relayjs-disconnect");
    console.log(res);
  }

  async componentDidMount() {
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    ipcRenderer.on("relayjs-updatestate", this.onRlyUpdate);
    await this.connect();
  }

  async componentWillUnmount() {
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    await this.disconnect();
  }

  render() {
    //Header
    let header = null;
    let headerButton = null;
    if (this.state.connected) {
      headerButton = (
        <Button
          disabled={this.state.loading}
          type="text"
          onClick={this.onClickDisconnect}
        >
          <DisconnectOutlined />
          Disconnect
        </Button>
      );
    } else {
      headerButton = (
        <Button
          disabled={this.state.loading}
          type="text"
          onClick={this.onClickConnect}
        >
          <ApiOutlined />
          Connect
        </Button>
      );
    }

    header = (
      <Row gutter={8}>
        <Col className="gutter-row">{headerButton}</Col>
      </Row>
    );

    //Alert component
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    let  alert = (
        <Alert
          type="error"
          banner
          message="Error"
          description={
            <Marquee pauseOnHover gradient={false}>
              {this.state.eMessage}
            </Marquee>
          }
          closable
          afterClose={() => {
            this.setState({
              error: false,
            });
          }}
        />
      );

    //Spin component
    let spinner = <Spin indicator={antIcon} tip="Connecting..." />;


    //Relay component
    let relays = this.state.relays.map((el, idx) => {
        return (
          <div key={`div_${idx}`} style={{ textAlign: "center" }}>
            <Row gutter={8}>
              <Col className="gutter-row">
                <Switch
                  checked={el.value}
                  disabled={!this.state.connected || this.state.isbusy}
                  style={{ margin: "4px" }}
                  key={`sw__${idx}`}
                  onChange={async () => {
                    await this.onClickSwitch(el, idx);
                  }}
                ></Switch>
              </Col>
              <Col className="gutter-row">
                <Typography key={`ty__${idx}`} style={{ color: "#fefefe" }}>
                  {(idx+1).toString().padStart(2, '0')}
                </Typography>
              </Col>
              <Col className="gutter-row">
                <Input placeholder="label" key={`ty__${idx}`} style={{ color: "#fefefe" }}/>
              </Col>
            </Row>
          </div>
        );
      });

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
    } else {
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

    let internalContent = null;
    if (this.state.loading && !this.state.connected) {
      internalContent = spinner;
    }else if(this.state.connected && !this.state.loading){
      internalContent = relays;
    }else if(!this.state.connected && !this.state.loading){
      internalContent = alert; 
    }

    return (
      <Layout className="layout">
        <Header className="header">{header}</Header>
        <Content className="content">
          <div className="internalContent">{internalContent}</div>
        </Content>
        <Footer className="footer">{footer}</Footer>
      </Layout>
    );
  }
}

export default App;
