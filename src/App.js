import React from "react";
import AppRender from "./AppRender";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import "./App.less";

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

    this.onOpenFile = this.onOpenFile.bind(this);
    this.onSaveFile = this.onSaveFile.bind(this);
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
    this.onClickMenuItem = this.onClickMenuItem.bind(this)
  }

  onClickMenuItem(event, tree) {
    switch (tree[0]) {
      case "File":
        switch (tree[1]) {
          case "Open":
            this.onOpenFile();
            break;
          case "Save":
            this.onSaveFile();
            break;
          case "Save as..":
            this.onSaveFile(true);
          default:
            break;
        }
        break;
      case "Settings":
        switch (tree[1]) {
          case "Port":
            this.onChangeUsbPort(tree[2]);
            break;
          default:
            break;
        }
      default:
        break;
    }
  }

  async onOpenFile() {
    const config = await ipcRenderer.invoke("app:openconfig");
    if (config) {
      this.setState({
        labels: config
      })
    }
  }

  async onSaveFile(showSaveDialog = false) {
    await ipcRenderer.invoke("app:saveconfig", {
      showSaveDialog: showSaveDialog,
      data: this.state.labels,
    });
  }

  onChangeUsbPort(option) {
    console.log(option);

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
    const res = await ipcRenderer.invoke("app:saveconf", appConfig);
  }

  async getAppConfig() {
    const res = await ipcRenderer.invoke("app:getconf");
    this.setState({
      labels: res.data.labels,
    });
  }

  onRlyUpdate(event, rlyState) {
    this.setState({
      connected: rlyState.connected,
      portConnected: rlyState.port,
      relays: rlyState.relays,
      eMessage: rlyState.errorMessage,
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
    const res = await ipcRenderer.invoke("relayjs:write", idx, Number(!isOpen));
    this.setState({
      isbusy: false,
    });
  }

  async connect() {
    this.setState({
      loading: true,
    });
    console.log("connect to portConnected:", this.state.portSelected);
    try {
      await ipcRenderer.invoke("relayjs:connect", this.state.portSelected);
    } catch (e) {
      console.log(e);
      this.setState({
        eMessage: e.message,
        loading: false,
      });
      return;
    }

    this.setState({
      loading: false,
    });
  }

  async disconnect() {
    const res = await ipcRenderer.invoke("relayjs:disconnect");
  }

  async componentDidMount() {
    ipcRenderer.off("menu:action", this.onClickMenuItem);
    ipcRenderer.off("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs:message", this.onRlyUpdate);

    ipcRenderer.on("menu:action", this.onClickMenuItem);
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    ipcRenderer.on("relayjs:message", this.onRlyUpdate);

    await ipcRenderer.invoke("dom:loaded");
    // await this.getAppConfig();
    await this.connect();
  }

  async componentWillUnmount() {
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);
    await this.saveAppConfig();
    await this.disconnect();
  }

  render() {
    return (
      <Spin
        className="spinner"
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        spinning={this.state.loading}
        tip="Connecting..."
      >
        <AppRender
          onClickSwitch={this.onClickSwitch}
          onClickConnect={this.onClickConnect}
          onClickDisconnect={this.onClickDisconnect}
          onChangeLabel={this.onChangeLabel}
          onOpenFile={this.onOpenFile}
          onSaveFile={this.onSaveFile}
          onSaveAsFile={this.onSaveAsFile}
          onChangeUsbPort={this.onChangeUsbPort}
          {...this.state}
        />
      </Spin>
    );
  }
}
export default App;
