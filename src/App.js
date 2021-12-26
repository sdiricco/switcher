import React from "react";
import AppRender from "./AppRender";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import "./App.less";
import {
  appOpenConfig,
  appSetTitle,
  appSaveConfig,
  appSaveAsConfig,
  menuUpdatePortList,
  relayWrite,
} from "./ElectronServices";

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
      isbusy: false,

      rlyCountSelected: undefined,

      error: {
        type: undefined,
        message: undefined,
        details: undefined,
      },
      relays: [],
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
    this.onRlyError = this.onRlyError.bind(this);
    this.onClickMenuItem = this.onClickMenuItem.bind(this);
    this.onUsbDetectionUpdate = this.onUsbDetectionUpdate.bind(this);
  }

  async onUsbDetectionUpdate(event, devices) {
    await menuUpdatePortList(devices);
  }

  onClickMenuItem(event, tree) {
    switch (tree[0]) {
      case "File":
        switch (tree[1]) {
          case "Open":
            this.openConfig({ openFromExplorer: true });
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
        break;
      default:
        break;
    }
  }

  async openConfig({ openFromExplorer = false } = {}) {
    let relays = this.state.relays;
    let __path = this.state.path;
    let __title = this.state.title;
    let rlyCountSelected = this.state.rlyCountSelected;

    try {
      const data = await appOpenConfig({ openFromExplorer: openFromExplorer });

      if (data) {
        if (data.config && data.config.labels) {
          rlyCountSelected = data.config.labels.length;
          //riempi labels
        }
        if (data.path) {
          __path = data.path;
          __title = path.parse(data.path).base;
        }
      }

      if (openFromExplorer) {
        await this.connect({ size: data.config.length });
      }

      await appSetTitle(__title);
    } catch (e) {
      console.log(e);
    }

    this.setState({
      path: __path,
      title: __title,
      rlyCountSelected: rlyCountSelected,
    });
  }

  async saveConfig() {
    const relaysConfig = this.state.relays.map((el, idx) => {
      return {
        type: el.type,
        label: el.label,
      };
    });
    const config = {
      relaysConfig: relaysConfig,
    };

    try {
      await appSaveConfig(config);
    } catch (e) {
      console.log(e);
    }
  }

  async saveAsConfig() {
    const relaysConfig = this.state.relays.map((el, idx) => {
      return {
        type: el.type,
        label: el.label,
      };
    });

    const config = {
      relaysConfig: relaysConfig,
    };

    try {
      await appSaveAsConfig(config);
    } catch (e) {
      console.log(e);
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
    let relays = this.state.relays;

    relays[idx].label = e.target.value;

    this.setState({
      relays: relays,
    });
  }

  async saveAppConfig() {
    const relaysConfig = this.state.relays.map((el, idx) => {
      return {
        type: el.type,
        label: el.label,
      };
    });

    const config = {
      relaysConfig: relaysConfig,
    };

    try {
      await appSaveConfig(config);
    } catch (e) {
      console.log(e);
    }
  }

  onRlyError(event, state) {
    console.log(state)

    const error = this.state.error;
    error.type = state.error.type;
    error.message = state.error.message;
    error.details = state.error.details;

    this.setState({
      connected: state.connected,
      error: error,
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

    const relays = this.state.relays;

    this.setState({
      isbusy: true,
    });

    const isOpen = Boolean(el.state);
    const value = Number(!isOpen);

    try {
      await relayWrite(idx, value);
      relays[idx].state = value;
    } catch (e) {
      console.log(e);
    }

    this.setState({
      isbusy: false,
      relays: relays,
    });
  }

  async onClickReconnect(rlyCount) {
    await this.connect({ size: rlyCount });
  }

  async connect({ port = undefined, size = undefined } = {}) {
    this.setState({
      loading: true,
    });

    const error = this.state.error;
    let relays = [];
    let connected = false;
    let portConnected = undefined;

    let __port = this.state.portSelected;
    let __size = this.state.rlyCountSelected;

    if (port) {
      __port = port;
    }
    if (size) {
      __size = size;
    }

    try {
      const result = await ipcRenderer.invoke("relayjs:connect", {
        port: __port,
        size: __size,
      });

      connected = result.data.connected;
      portConnected = result.data.port;

      relays = result.data.relays.map((el, idx) => {
        const isContained = idx < this.state.relays.length;
        return {
          type: el.type,
          state: el.state,
          label: isContained ? this.state.relays[idx].label : "",
        };
      });

      error.type = result.error.type;
      error.message = result.error.message;
      error.details = result.error.details;

    } catch (e) {
      console.log(e);
      return;
    }

    this.setState({
      loading: false,
      rlyCountSelected: relays.length,
      error: error,
      relays: relays,
      connected: connected,
      portConnected: portConnected,
    });
  }

  async disconnect() {
    let connected = this.state.connected;
    try {
      const result = await ipcRenderer.invoke("relayjs:disconnect");
      connected = result.data.connected;
    } catch (e) {
      console.log(e);
    }

    this.setState({
      connected: connected,
    });
  }

  async componentDidMount() {
    ipcRenderer.off("usbdetection:update", this.onUsbDetectionUpdate);
    ipcRenderer.off("menu:action", this.onClickMenuItem);
    ipcRenderer.off("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs:error", this.onRlyError);

    ipcRenderer.on("usbdetection:update", this.onUsbDetectionUpdate);
    ipcRenderer.on("menu:action", this.onClickMenuItem);
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    ipcRenderer.on("relayjs:error", this.onRlyError);

    await ipcRenderer.invoke("dom:loaded");
    await this.openConfig();
    await this.connect();
  }

  async componentWillUnmount() {
    ipcRenderer.on("port:change", this.onChangeUsbPort);
    ipcRenderer.off("relayjs:error", this.onRlyError);
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
