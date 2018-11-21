import React, { Component } from "react";
import { render } from "react-dom";
import LogContainer from "./containers/LogContainer.jsx";
import styles from "./../public/app.css";
import Effects from "./containers/Effects";
import TreeDiagram from "./components/TreeDiagram.jsx";
import { networkInterfaces } from "os";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: [],
      appState: [],
      toggleTool: false,
      clickData: []
    };
    this.handleNodeClick = this.handleNodeClick.bind(this);

    chrome.devtools.panels.create("Lucid", null, "devtools.html", () => {
      let state = this;
      const backgroundPort = chrome.runtime.connect({
        name: "devtool-background-port"
      });
      // send a 'connect' message to backgroundScript to trigger reactTraverse with the tabId
      backgroundPort.postMessage({
        name: "connect",
        tabId: chrome.devtools.inspectedWindow.tabId
      });

      backgroundPort.onMessage.addListener(req => {
        // * checks if the message it's receiving is about a request about an http request or a change in the DOM
        if (req.type === "requestLogs") {
          const newLogs = req.msg;
          // state.setState({ logs: newLogs });
        } else if (req.type === "appState") {
          const applicationState = req.msg;
          state.setState({ appState: applicationState });
        }
      });

      // chrome.devtools.network.onRequestFinished event provides an HTTP Archive format (HAR) entry as an argument to the event callback
      // * get request/response
      chrome.devtools.network.onRequestFinished.addListener(function (httpReq) {
        if (httpReq.request.url === "http://localhost:4000/graphql") {
          let log = {};
          log.req = httpReq.request;
          if (httpReq.response.content) {
            httpReq.getContent(responseBody => {
              const parsedResponseBody = JSON.parse(responseBody);
              log.res = httpReq.request;
              console.log("---LOG---: ", log);
              state.setState({ logs: [...state.state.logs, log] });
            });
          }
        }
      });
    });
  }

  handleNodeClick(data, event) {
    this.setState({ toggleTool: !this.state.toggleTool, clickData: data });
    console.log(this.state.toggleTool, 'after setState')
    //toggles true and false
    // console.log(this.state.clickData, 'this is clickData after setState') //grabs entire node data
  }

  render() {
    console.log('this is the state:', this.state)
    //if this.state.appState has not been populated by the reactTraverser.js, show a message that asks users to 'setState' else render our App (Tree, Log, Effects)
    if (this.state.appState.length===0) {
      return (
        <div id='reactLoader'>
          <h1>Please trigger a setState() to activate Lucid devtool.<br /></h1>
          <p>Note: Lucid works best on React v15/16</p>
        </div>
      )
    } else {
      return (
        <div id="app-container">
          {/* <LogContainer logs={this.state.logs} /> */}
          <h1>Welcome to React-Lucid</h1>
          {/* <Effects logs={this.state.logs} /> */}
          <TreeDiagram
            handleNodeClick={this.handleNodeClick}
            appState={this.state.appState}
            toggleTool={this.state.toggleTool}
            clickData={this.state.clickData}
          />
        </div>
      );
    }
  }
}


render(<App />, document.getElementById("root"));
