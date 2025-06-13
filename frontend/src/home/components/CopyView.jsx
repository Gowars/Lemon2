import { copyToClipboard } from "@/lemon-tools/copyToClipboard";
import { Modal } from "@/snake/main";
import React from "react";

export function CopyView({ text, children }) {
    const copy = (event) => {
        copyToClipboard(text || event.target.textContent);
        Modal.success("Copy success");
    }
    return <div className="pointer" onClick={copy}>{children || text}</div>
}
