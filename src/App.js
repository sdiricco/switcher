import React from "react";
import AppRender from "./AppRender";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import "./App.less";

const { ipcRenderer } = window.require("electron");

const AUTO = "Auto";


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
      rlyCount: undefined,
      rlyCountSelected: undefined,
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
    this.onClickReconnect = this.onClickReconnect.bind(this);
    this.onClickConnect = this.onClickConnect.bind(this);
    this.onClickDisconnect = this.onClickDisconnect.bind(this);
    this.onRlyUpdate = this.onRlyUpdate.bind(this);
    this.onClickMenuItem = this.onClickMenuItem.bind(this);
    this.onUsbDetectionUpdate = this.onUsbDetectionUpdate.bind(this);
  }

  async onUsbDetectionUpdate(event, devices){
    await ipcRenderer.invoke("menu:port:update", devices)
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
    try {
      await ipcRenderer.invoke("app:saveconfig", {
        showSaveDialog: false,
        data: appConfig,
      });
    } catch (e) {
      console.log(e)
    } 
  }

  async getAppConfig() {
    const labels = [];
    try {
      const res = await ipcRenderer.invoke("app:getconf");
      labels = res.data.labels;
    } catch (e) {
      console.log(e)
    }
    this.setState({
      labels: labels
    });
  }

  onRlyUpdate(event, rlyState) {
    const rlyCount = rlyState.relays.length ? rlyState.relays.length : undefined;
    this.setState({
      connected: rlyState.connected,
      portConnected: rlyState.port,
      relays: rlyState.relays,
      rlyCount: rlyCount,
      eMessage: rlyState.errorMessage,
    });
  }

  async onClickConnect() {
    try {
      await this.connect();
    } catch (e) {
      console.log(e)
    }
  }

  async onClickDisconnect() {
    try {
      await this.disconnect();
    } catch (e) {
      console.log(e)
    }
  }

  async onClickSwitch(el, idx) {
    if (this.state.isbusy) {
      return;
    }
    this.setState({
      isbusy: true,
    });
    const isOpen = Boolean(el.state);
    try {
      await ipcRenderer.invoke("relayjs:write", idx, Number(!isOpen));
    } catch (e) {
      console.log(e)
    }
    this.setState({
      isbusy: false,
    });
  }

  async onClickReconnect(rlyCount){
    await this.connect({size: rlyCount})
  }

  async connect({port = undefined, size = undefined} = {}) {

    this.setState({
      loading: true,
    });

    let __port = this.state.portSelected;
    let __size = this.state.rlyCountSelected;

    if (port) {
      __port = port;
    }
    if (size) {
      __size = size;
    }

    try {
      await ipcRenderer.invoke("relayjs:connect", {port: __port, size: __size});
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
      rlyCountSelected: __size
    });

  }

  async disconnect() {
    try {
      await ipcRenderer.invoke("relayjs:disconnect");
    } catch (e) {
      console.log(e) 
    }
  }

  async componentDidMount() {

    ipcRenderer.off("usbdetection:update", this.onUsbDetectionUpdate);
    ipcRenderer.off("menu:action", this.onClickMenuItem);
    ipcRenderer.off("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs:message", this.onRlyUpdate);

    ipcRenderer.on("usbdetection:update", this.onUsbDetectionUpdate);
    ipcRenderer.on("menu:action", this.onClickMenuItem);
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    ipcRenderer.on("relayjs:message", this.onRlyUpdate);

    await ipcRenderer.invoke("dom:loaded");
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
          onClickReconnect={this.onClickReconnect}
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
