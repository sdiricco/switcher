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
import AppHeader from "./components/AppHeader";
import { placeholder } from "@babel/types";

const { Option } = Select;
const { Header, Footer, Sider, Content } = Layout;
const { ipcRenderer } = window.require("electron");
const OPEN = 0;
const CLOSE = 1;

const OPTIONS_PORT = "port";

const AUTO = "auto";
const MANUAL = "manual";

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
      labels: [],
      usbDevices: [],
      connectMode: AUTO,
    };

    this.timeoutId = undefined;

    this.onChangeOptionsMenu = this.onChangeOptionsMenu.bind(this);
    this.onUpdateUsbDevices = this.onUpdateUsbDevices.bind(this);
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

  async onChangeOptionsMenu(tree) {
    console.log(tree);
    const entry = tree[0];
    switch (entry) {
      case OPTIONS_PORT:
        console.log(tree[1]);
        this.onChangeUsbPort(tree[1]);
        break;
      default:
        break;
    }
  }

  onChangeUsbPort(opt) {
    let connectMode = this.state.connectMode;
    let port = this.state.port;
    if (opt === AUTO) {
      connectMode = AUTO;
    } else {
      connectMode = MANUAL;
      port = opt;
    }
    this.setState({
      connectMode: connectMode,
      port: port,
    });
  }

  onUpdateUsbDevices(event, usbDevices) {
    this.setState({
      usbDevices: usbDevices,
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
    console.log(res);
  }

  async getAppConfig() {
    const res = await ipcRenderer.invoke("utils:get-app-conf");
    console.log("res.data.labels", res.data.labels);
    this.setState({
      labels: res.data.labels,
    });
  }

  onRlyUpdate(event, e, rlyState) {
    console.log(e);
    console.log(rlyState);

    this.setState({
      eMessage: `${e.message}. ${e.details}`,
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
    let port = undefined;
    this.setState({
      loading: true,
    });
    if (this.state.connectMode === MANUAL) {
      port = this.state.port;
    }
    const res = await ipcRenderer.invoke("relayjs:connect", port);

    this.setState({
      loading: false,
    });
  }

  async disconnect() {
    const res = await ipcRenderer.invoke("relayjs-disconnect");
    console.log(res);
  }

  async getUsbDevices() {
    const usbDevices = await ipcRenderer.invoke("utils:get-usb-devices");
    this.setState({
      usbDevices: usbDevices,
    });
  }

  async componentDidMount() {
    ipcRenderer.off("utils:update-usb-devices", this.onUpdateUsbDevices);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    ipcRenderer.on("relayjs-updatestate", this.onRlyUpdate);
    ipcRenderer.on("utils:update-usb-devices", this.onUpdateUsbDevices);
    await this.getUsbDevices();
    await this.getAppConfig();
    await this.connect();
  }

  async componentWillUnmount() {
    ipcRenderer.off("utils:update-usb-devices", this.onUpdateUsbDevices);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    await this.saveAppConfig();
    await this.disconnect();
  }

  render() {

    let usbDevices = this.state.usbDevices.map((device) => {
      return {
        value: device.port,
        label: device.port,
      };
    });

    //menu of options button
    const optionsMenu = [
      {
        value: "open",
        label: "Open..",
      },
      {
        value: "save",
        label: "Save",
      },
      {
        value: "save-as",
        label: "Save as..",
      },
      {
        value: "port",
        label: "Port",
        children: [
          {
            value: "auto",
            label: "Auto",
          },
          ...usbDevices,
        ],
      },
    ];

    //header elements
    const entries = [
      {
        label: "Options",
        menu: optionsMenu,
      },
    ];

    //header
    let header = (
      <AppHeader entries={entries} onChange={this.onChangeOptionsMenu} />
    );

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
    const port = this.state.port;
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
            content: port,
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
        <Header className={`header menu`}>{header}</Header>
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
