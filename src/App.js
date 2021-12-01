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
  Select,
} from "antd";
import {
  ExclamationCircleFilled,
  CheckCircleFilled,
  LoadingOutlined,
  ApiOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";

import "./App.less";

import Relay from "./components/Relay";
import AppFooter from "./components/AppFooter";
import { placeholder } from "@babel/types";

const { Option } = Select;
const { Header, Footer, Sider, Content } = Layout;
const { ipcRenderer } = window.require("electron");
const OPEN = 0;
const CLOSE = 1;

const AUTO = "Auto";
const MANUAL = "Manual";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      connected: false,
      portConnected: undefined,
      portSelected: undefined,
      loading: false,
      eMessage: "",
      relays: [],
      isbusy: false,
      labels: [],
    };

    this.timeoutId = undefined;

    this.onChangeUsbPort = this.onChangeUsbPort.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.saveAppConfig = this.saveAppConfig.bind(this);
    this.getAppConfig = this.getAppConfig.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onClickSwitch = this.onClickSwitch.bind(this);
    this.onClickConnect = this.onClickConnect.bind(this);
    this.onClickDisconnect = this.onClickDisconnect.bind(this);
    this.onRlyUpdate = this.onRlyUpdate.bind(this);
  }

  onChangeUsbPort(event, option) {
    console.log(option)

    let portSelected = undefined;
    if (option === AUTO) {
    } else {
      portSelected = option;
    }
    this.setState({
      portSelected: portSelected,
    });
  }

  onChangeLabel(e, idx) {
    let labels = this.state.labels;
    if (!labels.length) {
      labels = this.state.relays.map(() => "");
    }
    labels[idx] = e.target.value;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(async () => {
      await this.saveAppConfig();
    }, 1000);
    this.setState({
      labels: labels,
    });
  }

  async saveAppConfig() {
    const appConfig = {
      labels: this.state.labels,
    };
    const res = await ipcRenderer.invoke("utils:save-app-conf", appConfig);
  }

  async getAppConfig() {
    const res = await ipcRenderer.invoke("utils:get-app-conf");
    this.setState({
      labels: res.data.labels,
    });
  }

  onRlyUpdate(event, e, rlyState) {
    this.setState({
      eMessage: `${e.message}. ${e.details}`,
      connected: rlyState.connected,
      portConnected: rlyState.port,
      relays: rlyState.relays,
    });
  }

  async onClickConnect() {
    const res = await this.connect();
  }

  async onClickDisconnect() {
    const res = await this.disconnect();
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
    this.setState({
      isbusy: false,
    });
  }

  async connect() {
    this.setState({
      loading: true,
    });
    console.log("connect to portConnected:", this.state.portSelected)
    const res = await ipcRenderer.invoke("relayjs:connect", this.state.portSelected);
    this.setState({
      loading: false,
    });
  }

  async disconnect() {
    const res = await ipcRenderer.invoke("relayjs-disconnect");
  }

  async componentDidMount() {
    ipcRenderer.off("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    ipcRenderer.on("relayjs-updatestate", this.onRlyUpdate);
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    await ipcRenderer.invoke("dom:loaded");
    await this.getAppConfig();
    await this.connect();
  }

  async componentWillUnmount() {
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    await this.saveAppConfig();
    await this.disconnect();
  }

  render() {

    //Header
    let toolbar = null;
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

    toolbar = (
      <Row gutter={8} wrap={false}>
        <Col className="gutter-row">{headerButton}</Col>
      </Row>
    );

    //Relay component
    let relays = this.state.relays.map((el, idx) => {
      const index = (idx + 1).toString().padStart(2, "0");
      return (
        <Relay
          key={`relay-${idx}`}
          switchProps={{
            checked: el.value,
            disabled: !this.state.connected || this.state.isbusy,
            onChange: () => {
              this.onClickSwitch(el, idx);
            },
          }}
          index={index}
          inputLabelProps={{
            value: this.state.labels[idx],
            placeholder: "label",
            onChange: (e) => {
              this.onChangeLabel(e, idx);
            },
          }}
        />
      );
    });

    //footer elements
    const successIcon = <CheckCircleFilled style={{ color: "#52c41a" }} />;
    const portConnected = this.state.portConnected;
    const errorIcon = <ExclamationCircleFilled style={{ color: "#a61d24" }} />;
    const errorLabel = "Disconnected";

    let footer = (
      <AppFooter
        elems={[
          {
            content: successIcon,
            hidden: !this.state.connected,
          },
          {
            content: portConnected,
            hidden: !this.state.connected,
          },
          {
            content: errorIcon,
            hidden: this.state.connected,
          },
          {
            content: errorLabel,
            hidden: this.state.connected,
          },
        ]}
      />
    );

    //Alert component
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    let alert = (
      <Alert
        className="alert"
        type="error"
        banner
        message="Error"
        description={
          <Marquee pauseOnHover gradient={false}>
            {this.state.eMessage}
          </Marquee>
        }
        closable
      />
    );

    //Spin component
    let spinner = <Spin indicator={antIcon} tip="Connecting..." />;

    let internalContent = null;
    if (this.state.loading && !this.state.connected) {
      internalContent = spinner;
    } else if (this.state.connected && !this.state.loading) {
      internalContent = relays;
    } else if (!this.state.connected && !this.state.loading) {
      internalContent = alert;
    }

    return (
      <Layout className="layout">
        <Content className="content">
          <Header className={`header headerContent`}>{toolbar}</Header>
          <div className="contentWrapper">
            <div className="internalContent">{internalContent}</div>
          </div>
        </Content>
        <Footer className="footer">{footer}</Footer>
      </Layout>
    );
  }
}

export default App;
