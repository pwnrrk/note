import App from "./app";
import ReactDom from "react-dom";
import React from "react";
import "./index.css";

ReactDom.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("app")
);
