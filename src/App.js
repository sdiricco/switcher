import React from "react";
import AppRender from "./AppRender";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import "./App.less"

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
    this.onSaveAsFile = this.onSaveAsFile.bind(this);

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

  async onOpenFile(event, data) {
    await ipcRenderer.invoke("utils:open-custom-app-config");
    console.log("open");
  }

  async onSaveFile(event, data) {
    console.log("save");
  }

  async onSaveAsFile(event, data) {
    await ipcRenderer.invoke("utils:saveas-custom-app-config");
    console.log("save as");
  }

  onChangeUsbPort(event, option) {
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
    console.log("connect to portConnected:", this.state.portSelected);
    const res = await ipcRenderer.invoke(
      "relayjs:connect",
      this.state.portSelected
    );
    this.setState({
      loading: false,
    });
  }

  async disconnect() {
    const res = await ipcRenderer.invoke("relayjs-disconnect");
  }

  async componentDidMount() {
    ipcRenderer.off("menu:file:open", this.onOpenFile);
    ipcRenderer.off("menu:file:save", this.onSaveFile);
    ipcRenderer.off("menu:file:saveas", this.onSaveAsFile);
    ipcRenderer.off("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs-updatestate", this.onRlyUpdate);

    ipcRenderer.on("menu:file:open", this.onOpenFile);
    ipcRenderer.on("menu:file:save", this.onSaveFile);
    ipcRenderer.on("menu:file:saveas", this.onSaveAsFile);
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    ipcRenderer.on("relayjs-updatestate", this.onRlyUpdate);

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
    return (
      <Spin
        className="spinner"
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        spinning={this.state.loading}
        tip="Connecting..."
      >
        <AppRender
          connected={this.state.connected}
          portConnected={this.state.portConnected}
          portSelected={this.state.portSelected}
          loading={this.state.loading}
          eMessage={this.state.eMessage}
          relays={this.state.relays}
          isbusy={this.state.isbusy}
          labels={this.state.labels}
          onOpenFile={this.onOpenFile}
          onSaveFile={this.onSaveFile}
          onSaveAsFile={this.onSaveAsFile}
          onChangeUsbPort={this.onChangeUsbPort}
          onChangeLabel={this.onChangeLabel}
          saveAppConfig={this.saveAppConfig}
          getAppConfig={this.getAppConfig}
          connect={this.connect}
          onClickSwitch={this.onClickSwitch}
          onClickConnect={this.onClickConnect}
          onClickDisconnect={this.onClickDisconnect}
          onRlyUpdate={this.onRlyUpdate}
        />
      </Spin>
    );
  }
}
export default App;
