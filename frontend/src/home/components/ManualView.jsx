import { getAppState, setAppState, useAppState } from "@/src/store";
import { useBetterState } from "@/snake/useLib/index.jsx";
import React from "react";

import S from "./../index.module.scss";
import cx from "@/lemon-tools/cx";
import { Form, Textarea } from "@/snake/UI/Form";
import { Input } from "@/snake/UI/Form/index";
import Button from "@/snake/UI/Button";
import { Modal } from "@/snake/main";
import { uuid32 } from "@/lemon-tools/uuid";
import { FieldView } from "./FieldView";
import { createVmess, safeParse } from "../helper";
import { convertConfig2vmess, selectNode } from "../service";
import { language } from "@/src/i18n/en";

export function ManualView(props) {
    const appState = useAppState();
    const serv = appState.manualConfig.find(
        (i) => i.lemon2id == props.lemon2id,
    );
    const { state, setState, resetState } = useBetterState({
        mode: props.lemon2id ? "Edit" : "Add",
        content: JSON.stringify(serv ? serv.content : createVmess({}), null, 4),
        ps: serv ? serv.ps : "",
    });

    const submit = async () => {
        const content = safeParse(state.content);
        if (typeof content == "string") {
            Modal.fail(
                language.TheConfigurationIsNotInJsonFormatPleaseModifyIt,
            );
            return;
        }
        const ps = state.ps.trim();
        if (!ps) {
            Modal.fail(language.RemarksCannotBeEmpty);
            return;
        }
        const setting = convertConfig2vmess(content, ps);
        if (state.mode == "Add") {
            setAppState({}, (draft) => {
                draft.manualConfig.push({
                    content,
                    ps,
                    lemon2id: uuid32(),
                    setting,
                });
            });
        } else {
            setAppState({}, (draft) => {
                draft.manualConfig.forEach((ele) => {
                    if (ele.lemon2id == serv.lemon2id) {
                        ele.content = content;
                        ele.ps = ps;
                        ele.setting = setting;
                    }
                });
            });
            // 再次选中节点，以刷新配置
            if (serv.lemon2id == getAppState().tag) {
                selectNode(serv.lemon2id);
            }
        }
        props.callback?.(state);
        props.close?.();
        Modal.success("success");
    };

    return (
        <div
            className={cx("flex1 pp15 br7")}
            style={{
                width: "80vw",
                maxHeight: "calc(100vh - 100px)",
                background: "var(--whiteBgd)",
                overflow: "scroll",
            }}
        >
            <div className="ui-flex fs11">
                <span className="flex1"></span>
                <Button
                    onClick={resetState}
                    className="mr10 modal-close"
                    theme="cancel"
                >
                    Cancel
                </Button>
                <Button onClick={submit}>{language.Save}</Button>
            </div>
            <Form value={state} onChange={(v) => setState(v)} noRoot>
                <FieldView title={language.Remark}>
                    <Input name="ps" className={S.flex1} />
                </FieldView>
                <FieldView title={language.ManualConfiguration}>
                    <Textarea
                        minHeight="250px"
                        name="content"
                        className={S.flex1}
                        autoHeight
                    />
                </FieldView>
            </Form>
        </div>
    );
}
