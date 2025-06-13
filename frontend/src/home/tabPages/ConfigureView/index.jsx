import { setAppState, useAppState } from "@/src/store";
import { useBetterState } from "@/snake/useLib/index.jsx";
import React from "react";

import cx from "@/lemon-tools/cx";
import { Form, Textarea } from "@/snake/UI/Form";
import { Input } from "@/snake/UI/Form/index";
import Button from "@/snake/UI/Button";
import { Modal } from "@/snake/main";
import { safeParse } from "@/src/home/helper";
import { FieldView } from "@/src/home/components/FieldView";
import { selectNode, updateGFW } from "@/src/home/service";
import { language } from "@/src/i18n/en";

import S from "./index.module.scss";

const pac2From = (v) => {
    return safeParse(v).join("\n");
};
const form2pac = (v) => {
    return JSON.stringify(
        v
            .split(/\n/)
            .map((i) => i.trim().replace(/^domain:/i, ""))
            .filter((i) => i),
        null,
        4,
    );
};

export function ConfigureView() {
    const appState = useAppState();
    const { state, setState, stateRef } = useBetterState({
        httpPort: appState.httpPort,
        socksPort: appState.socksPort,
        pacPort: appState.pacPort,
        v2rayIP: appState.v2rayIP,
        remotePacUrl: appState.remotePacUrl,
        subscribe: appState.subscribe,
        gfwUrl: appState.gfwUrl,
        pacDirect: pac2From(appState.pacDirect),
        pacProxy: pac2From(appState.pacProxy),
    });

    const handleGFWUpdate = () => {
        updateGFW(stateRef.current.gfwUrl);
        Modal.success("Update Success");
    };

    const submit = async () => {
        setAppState({
            httpPort: Number(state.httpPort || "1087"),
            socksPort: Number(state.socksPort || "7890"),
            pacPort: Number(state.pacPort || "7890"),
            v2rayIP: state.v2rayIP,
            remotePacUrl: state.remotePacUrl,
            gfwUrl: state.gfwUrl,
            pacDirect: form2pac(state.pacDirect),
            pacProxy: form2pac(state.pacProxy),
        });
        selectNode(appState.tag);
        Modal.success("save success");
        updateGFW(stateRef.current.gfwUrl);
    };

    return (
        <div className={cx("flex1 pp30", S.preview, "scroller")}>
            <div className="ui-flex">
                <span className="flex1"></span>
                <Button className="mb10" onClick={submit}>
                    Save
                </Button>
            </div>
            <Form value={state} onChange={(v) => setState(v)} noRoot>
                <FieldView title="Local Http Listen Port:">
                    <Input name="httpPort" placeholder="" className={S.flex1} />
                </FieldView>
                <FieldView title="Local Sock Listen Port:">
                    <Input
                        name="socksPort"
                        placeholder=""
                        className={S.flex1}
                    />
                </FieldView>
                <FieldView title="Pac Server Listen Port:">
                    <Input name="pacPort" placeholder="" className={S.flex1} />
                </FieldView>
                <FieldView title="V2ray IP" tips="0.0.0.0/127.0.0.1">
                    <Input name="v2rayIP" placeholder="" className={S.flex1} />
                </FieldView>
                <FieldView
                    title="GFW List Url"
                    tips={
                        <span className="pointer" onClick={handleGFWUpdate}>
                            {language.Refresh}
                        </span>
                    }
                >
                    <Input
                        minHeight="4em"
                        autoHeight
                        name="gfwUrl"
                        placeholder=""
                        className={S.flex1}
                    />
                </FieldView>
                <FieldView
                    title="Pac Proxy Rules"
                    tips={language.UsefulInDirectMode}
                >
                    <Textarea
                        minHeight="4em"
                        autoHeight
                        name="pacProxy"
                        placeholder="google.com"
                        className={S.flex1}
                    />
                </FieldView>
                <FieldView
                    title="Pac Direct Rules"
                    tips={language.UsefulInProxyMode}
                >
                    <Textarea
                        minHeight="4em"
                        autoHeight
                        name="pacDirect"
                        placeholder="deepseek.com"
                        className={S.flex1}
                    />
                </FieldView>
                <FieldView title="Remote Pac Url" tips="">
                    <Input
                        name="remotePacUrl"
                        placeholder="http://127.0.0.1:80/proxy.js"
                        className={S.flex1}
                    />
                </FieldView>
            </Form>
        </div>
    );
}
