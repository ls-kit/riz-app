import React from "react";
import WebShell from "../components/WebShell";
import { HOME_URL } from "../lib/constants";

export default function Web() {
  return <WebShell url={HOME_URL} />;
}
