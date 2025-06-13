import React from "react";
import ReactDOM from "react-dom/client";
import { Page } from "./home/index.jsx";
import { ErrorBoundary } from "./error.jsx";
import "./sass/base.scss";

export default Page;

ReactDOM.createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
        <Page />
    </ErrorBoundary>,
);
