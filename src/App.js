import React from "react";
import AppRender from "./AppRender";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import "./App.less";
import {appOpenConfig, appSetTitle, appSaveConfig, appSaveAsConfig, menuUpdatePortList, relayWrite} from "./ElectronServices"; 


const { ipcRenderer } = window.require("electron");
const path = window.require("path");

const AUTO = "Auto";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      title: "Untiled",
      path: "",
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

    this.openConfig = this.openConfig.bind(this);
    this.saveConfig = this.saveConfig.bind(this);
    this.saveAsConfig = this.saveAsConfig.bind(this);
    this.onChangeUsbPort = this.onChangeUsbPort.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.saveAppConfig = this.saveAppConfig.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onClickSwitch = this.onClickSwitch.bind(this);
    this.onClickReconnect = this.onClickReconnect.bind(this);
    this.onClickConnect = this.onClickConnect.bind(this);
    this.onClickDisconnect = this.onClickDisconnect.bind(this);
    this.onRlyUpdate = this.onRlyUpdate.bind(this);
    this.onClickMenuItem = this.onClickMenuItem.bind(this);
    this.onUsbDetectionUpdate = this.onUsbDetectionUpdate.bind(this);
    this.autosave = this.autosave.bind(this);
  }

  async autosave({ enable = false, time = 1000 } = {}) {
    if (!enable) {
      return;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(async () => {
      await this.saveAppConfig();
    }, time);
  }

  async onUsbDetectionUpdate(event, devices) {
    await menuUpdatePortList(devices);
  }

  onClickMenuItem(event, tree) {
    switch (tree[0]) {
      case "File":
        switch (tree[1]) {
          case "Open":
            this.openConfig({openFromExplorer: true});
            break;
          case "Save":
            this.saveConfig();
            break;
          case "Save as..":
            this.saveAsConfig();
            break;
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
        break;
      case "Help":
        switch (tree[1]) {
          case "Learn More":
            console.log("Learn More");
            break;
          default:
            break;
        }
      default:
        break;
    }
  }

  async openConfig({ openFromExplorer = false } = {}) {
    let __labels = this.state.labels;
    let __path = this.state.path;
    let __title = this.state.title;

    try {
      const data = await appOpenConfig({openFromExplorer: openFromExplorer})

      if (data) {
        if (data.config && data.config.labels) {
          __labels = data.config.labels;
        }
        if (data.path) {
          __path = data.path;
          __title = path.parse(data.path).base;
        }
      }

      await appSetTitle(__title);

    } catch (e) {
      console.log(e);
    }

    this.setState({
      labels: __labels,
      path: __path,
      title: __title,
    });
  }

  async saveConfig() {
    const config = {
      labels: this.state.labels,
    };

    try {
      await appSaveConfig(config);  
    } catch (e) {
      console.log(e)
    }

  }

  async saveAsConfig() {
    const config = {
      labels: this.state.labels,
    };

    try {
      await appSaveAsConfig(config);
    } catch (e) {
      console.log(e)
    }

  }

  onChangeUsbPort(option) {
    let portSelected = undefined;

    if (option !== AUTO) {
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

    this.setState({
      labels: labels,
    });

    this.autosave({ enable: false });
  }

  async saveAppConfig() {
    const config = {
      labels: this.state.labels,
    };

    try {
      await appSaveConfig(config)
    } catch (e) {
      console.log(e);
    }
  }

  onRlyUpdate(event, rlyState) {

    const rlyCount = rlyState.relays.length
      ? rlyState.relays.length
      : undefined;

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
      console.log(e);
    }
  }

  async onClickDisconnect() {
    try {
      await this.disconnect();
    } catch (e) {
      console.log(e);
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
      await relayWrite(idx, Number(!isOpen));
    } catch (e) {
      console.log(e);
    }
    this.setState({
      isbusy: false,
    });
  }

  async onClickReconnect(rlyCount) {
    await this.connect({ size: rlyCount });
  }

  async connect({ port = undefined, size = undefined } = {}) {
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
      await ipcRenderer.invoke("relayjs:connect", {
        port: __port,
        size: __size,
      });
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
      rlyCountSelected: __size,
    });
  }

  async disconnect() {
    try {
      await ipcRenderer.invoke("relayjs:disconnect");
    } catch (e) {
      console.log(e);
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
    await this.openConfig();
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
          onSaveAsFile={this.onSaveAsFile}
          onChangeUsbPort={this.onChangeUsbPort}
          {...this.state}
        />
      </Spin>
    );
  }
}
export default App;
