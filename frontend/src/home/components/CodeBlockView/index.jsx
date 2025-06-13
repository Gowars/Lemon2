import Prism from "prismjs";
import './dark.scss'
import './light.scss'
import "prismjs/components/prism-json"; // 引入 Go 语言支持
import "prismjs/components/prism-javascript"; // 引入 Go 语言支持
import "prismjs/components/prism-bash"; // 引入 Go 语言支持
import React, { useRef, useEffect } from "react";
import cx from "@/lemon-tools/cx";
import S from "./index.module.scss";
import { copyToClipboard } from "@/lemon-tools/copyToClipboard";
import { Modal } from "@/snake/main";
import { callGo } from "@/src/home/core";
import { checkIsDarkMode, watchDarkMode } from "@/lemon-tools/watchDarkMode";
import { useBetterState } from "@/snake/useLib";

export function CodeBlockView({
    code,
    language = "json",
    className = "",
    style = {},
    theme = "",
    url = "",
    ...otherProps
}) {
    const ref = useRef();
    useEffect(() => {
        // Prism.highlightElement(ref.current);
        Prism.highlightAll();
    }, [code]);

    const handleCopy = (event) => {
        event.stopPropagation();
        copyToClipboard(otherProps.realCode || code);
        Modal.success("Copy Success");
    };

    const { state, setState } = useBetterState({ darkMode: checkIsDarkMode() })
    useEffect(() => {
        return watchDarkMode((darkMode) => {
            setState({ darkMode })
        })
    }, [])

    return (
        <div
            className={cx(
                S.codeBox,
                theme ? S[theme] : S.themeAuto,
                "flex1",
                className,
                state.darkMode ? 'dark-code-theme' : 'light-code-theme',
            )}
            style={style}
        >
            <div className={S.tools}>
                {!!url && (
                    <div
                        onClick={() => callGo("open-url", url)}
                        className={S.copy}
                    >
                        <img
                            src="/icons/safari.png"
                            alt=""
                            className="w14 h14"
                        />
                    </div>
                )}
                <div onClick={handleCopy} className={S.copy}>
                    <img src="/icons/copy.png" alt="" className="w14 h14" />
                </div>
            </div>
            <pre ref={ref} style={{ margin: 0 }}>
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    );
}
