import React, { useEffect, useRef, useState } from "react";
import S from "./index.module.scss";
import HotKey from "@/lemon-tools/hotkeys";
import cx from "@/lemon-tools/cx";

export function MoreEditView(props) {
    const [isShow, update] = useState(false);
    const dRef = useRef();
    const handleClick = (event) => {
        event.stopPropagation();
        update(!isShow);
    };
    const handleClose = () => {
        update(false);
    };

    useEffect(() => {
        if (isShow) {
            const handler = (event) => {
                if (!dRef.current?.contains(event.target)) {
                    update(false);
                }
            };
            window.addEventListener("click", handler, { capture: true });
            const { unmount } = new HotKey().on("esc", () => {
                update(false);
            });
            return () => {
                window.removeEventListener("click", handler);
                unmount();
            };
        }
    }, [isShow]);

    return (
        <div className={S.view} ref={dRef}>
            <div onClick={handleClick} className={cx(S.more)}>
                :
            </div>
            {isShow && (
                <div className={S.list}>
                    {props.data.map((item) => (
                        <div
                            className={S.item}
                            key={item.name}
                            onClick={(event) => {
                                event.stopPropagation();
                                item.onClick(item, handleClose);
                            }}
                        >
                            {item.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
