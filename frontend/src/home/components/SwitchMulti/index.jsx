import React, { useEffect, useRef } from "react";
import S from "./index.module.scss";
import cx from "@/lemon-tools/cx";
import { findParent } from "@/lemon-tools/domUtil";
import { useBetterState } from "@/snake/useLib";

export function SwitchMulti(props) {
    const { data = [], value, onChange, disabled } = props;
    const d = useRef();
    const { state, setState } = useBetterState({ hoverId: "" });

    useEffect(() => {
        d.current.addEventListener("mousemove", (e) => {
            const dom = findParent(e.target, (x) => x.dataset.id);
            if (dom) {
                setState({ hoverId: dom.dataset.id });
            } else {
                setState({ hoverId: "" });
            }
        });
    }, []);

    return (
        <div
            className={S.withTips}
            onMouseLeave={() => setState({ hoverId: "" })}
        >
            <div className={cx(S.tabs, disabled && S.disabled)} ref={d}>
                {data.map((i) => {
                    return (
                        <div
                            className={cx(
                                value === i.value && S.active,
                                S.item,
                            )}
                            onClick={() => onChange(i.value)}
                            key={i.text}
                            data-id={i.text}
                        >
                            {i.text}
                        </div>
                    );
                })}
            </div>
            {!!data.find((i) => i.text == state.hoverId)?.desc && (
                <div className={S.desc}>
                    <div className={S.inner}>
                        {data.find((i) => i.text == state.hoverId)?.desc}
                    </div>
                </div>
            )}
        </div>
    );
}
