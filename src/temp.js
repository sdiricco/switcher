import React from "react";
import { Button, Switch, Typography, Input, Layout } from "antd";
import './App.less';

const { Header, Footer, Sider, Content } = Layout;
const { ipcRenderer } = window.require("electron");

class App extends React.Component {
  constructor(props){
    super(props);
    this.props = props;
    this.state = {
      info: {},
      isConnected: false,
      relays: [],
      isbusy: false
    }
    this.onClickSwitch = this.onClickSwitch.bind(this)
    this.onRelayJsError = this.onRelayJsError.bind(this)
    this.onUpdateRelayJsState = this.onUpdateRelayJsState.bind(this)
  }

  onRelayJsError(event, data){
    console.log(data)
  }

  onUpdateRelayJsState(event, data){
    console.log(data)
    this.setState({
      info: data.info,
      isConnected: data.info.connected,
      relays: data.relays
    })
  }

  async onClickSwitch(el){
    this.setState({isbusy: true})
    let relays = this.state.relays;
    const value = Number(!el.value)
    await ipcRenderer.invoke("set-relay", el.pin, value);
    const __relays = relays.map((__el) => {
      if (__el.pin === el.pin) {
        return {
          pin: __el.pin,
          type: __el.type,
          value: value
        }
      }
    })
    this.setState({
      relays: relays,
      isbusy: false
    })
  }

  async componentDidMount(){
    await ipcRenderer.invoke("connect");
    ipcRenderer.on("relayjs-error", this.onRelayJsError)
    ipcRenderer.on("update-relayjs-state", this.onUpdateRelayJsState);
  }

  render() {
    return (
      <div className="mainContainer">
        <Input className="port" value={this.state.info.port} />
        <div className="relayContainer">
        {this.state.relays.map((el)=>{
          return(
            <div style={{textAlign: "center"}}>
              <Typography style={{color: "#fefefe"}}>{el.pin}</Typography>
              <Switch checked={el.value} disabled={!this.state.isConnected || this.state.isbusy} style={{margin: "4px"}} key={`sw__${el.pin}`} onChange={()=>{
                this.onClickSwitch(el)
              }} ></Switch>
            </div>
          )
        })}
        </div>
      </div>
    );
  }
}

export default App;
