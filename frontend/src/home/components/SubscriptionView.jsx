import { getAppState, setAppState, useAppState } from "@/src/store";
import { useBetterState } from "@/snake/useLib/index.jsx";
import React from "react";

import S from "./../index.module.scss";
import cx from "@/lemon-tools/cx";
import { Form } from "@/snake/UI/Form";
import { Input } from "@/snake/UI/Form/index";
import Button from "@/snake/UI/Button";
import { Modal } from "@/snake/main";
import { uuid32 } from "@/lemon-tools/uuid";
import { FieldView } from "./FieldView";
import { language } from "@/src/i18n/en";

export function onDelSub(id) {
    Modal.confirm(language.AreYouSureYouWantToDelete, () => {
        setAppState({
            subscribes: getAppState().subscribes.filter((i) => i.id !== id),
        });
    });
}

export function onEditSub(id) {
    Modal.open(<SubscriptionView id={id} />, {
        position: "center",
        animationType: "ss",
        escClose: true,
    });
}

export const handleAddSub = () => {
    Modal.open(<SubscriptionView />, {
        position: "center",
        animationType: "ss",
        escClose: true,
    });
};

export function SubscriptionView(props) {
    const appState = useAppState();
    const serv = appState.subscribes.find((i) => i.id == props.id);
    const { state, setState, resetState } = useBetterState({
        mode: props.id ? "Edit" : "Add",
        url: serv ? serv.url : "",
        tag: serv ? serv.tag : "",
    });

    const submit = async () => {
        const url = state.url;
        if (state.mode == "Add") {
            setAppState({}, (draft) => {
                draft.subscribes.push({
                    url,
                    tag: state.tag,
                    servers: [],
                    id: uuid32(),
                });
            });
        } else {
            setAppState({}, (draft) => {
                draft.subscribes.forEach((ele) => {
                    if (ele.id == serv.id) {
                        ele.url = url;
                        ele.tag = state.tag;
                    }
                });
            });
        }
        props.callback?.(state);
        props.close?.();
        Modal.success("success");
    };

    return (
        <div
            className={cx("flex1 pp15 pt20 pb20 br7")}
            style={{ width: "70vw", background: "var(--whiteBgd)" }}
        >
            <Form value={state} onChange={(v) => setState(v)} noRoot>
                <FieldView title={language.Remark}>
                    <Input name="tag" className={S.flex1} />
                </FieldView>
                <FieldView title={language.SubscriptionLinkAddress}>
                    <Input name="url" className={S.flex1} />
                </FieldView>
            </Form>
            <div className="ui-flex fs11">
                <span className="flex1"></span>
                <Button
                    onClick={resetState}
                    className="mr10 modal-close"
                    theme="cancel"
                >
                    {language.Cancel}
                </Button>
                <Button onClick={submit}>{language.Save}</Button>
            </div>
        </div>
    );
}
