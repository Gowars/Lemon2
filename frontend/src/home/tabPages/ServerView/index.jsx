import { setAppState, useAppState } from "@/src/store";
import { useBetterState } from "@/snake/useLib/index.jsx";
import React, { useEffect, useMemo, useRef, useState } from "react";

import S from "./index.module.scss";
import cx from "@/lemon-tools/cx";
import { callGo, watchGoEvent } from "@/src/home/core.js";
import Button from "@/snake/UI/Button";
import {
    getAllVmess,
    getSelectNodeConfig,
    refreshServers,
    selectNode,
} from "@/src/home/service";
import { CodeBlockView } from "@/src/home/components/CodeBlockView";
import { Modal } from "@/snake/main";
import { ManualView } from "@/src/home/components/ManualView";
import { safeParse } from "@/src/home/helper";
import {
    handleAddSub,
    onDelSub,
    onEditSub,
} from "@/src/home/components/SubscriptionView";
import { language } from "@/src/i18n";
import { MoreEditView } from "@/src/home/components/MoreEditView";
import { Form, Input } from "@/snake/UI/Form";
import { LogView } from "../LogView";
import { clone } from "@/lemon-tools/clone";

function openAddModal(lemon2id) {
    Modal.open(<ManualView lemon2id={lemon2id} />, {
        position: "center",
        animationType: "ss",
        escClose: true,
    });
    return;
}

const handleSelectServer = (event) => {
    selectNode(event.currentTarget.dataset.id);
};

const handleDel = (lemon2id) => {
    Modal.confirm(language.AreYouSureYouWantToDelete, () => {
        setAppState(
            {
                // tag: state.edit.ps,
            },
            (draft) => {
                draft.manualConfig = draft.manualConfig.filter(
                    (ele) => ele.lemon2id != lemon2id,
                );
            },
        );
    });
};

function ServerNodeView(props) {
    const { i, index } = props;
    const appState = useAppState();

    return (
        <div
            onClick={handleSelectServer}
            data-id={i.lemon2id}
            className={cx(
                S.serverItem,
                [i.lemon2id].includes(appState.tag) && S.active,
            )}
        >
            <span className="app-text-gray">{index + 1}.</span>
            <span className={cx("flex1 mr5 ml5", S.ps)}>{i.ps}</span>
            <span className="app-text-gray fs10">{props.ping}</span>
            {i.manual && (
                <MoreEditView
                    data={[
                        {
                            name: "Edit",
                            onClick: (d, close) => {
                                openAddModal(i.lemon2id);
                                close();
                            },
                        },
                        {
                            name: "Delete",
                            onClick: (d, close) => {
                                handleDel(i.lemon2id);
                                close();
                            },
                        },
                    ]}
                />
            )}
        </div>
    );
}

function ServerListView(props) {
    const { sub, url } = props;
    const { state, setState, stateRef } = useBetterState({
        pingResult: {},
        expand: true,
    });
    const { tag } = useAppState();
    const isSelected = !!sub.servers.find((i) => i.lemon2id == tag);
    useEffect(() => {
        url && refreshServers(url);
    }, [url]);

    useEffect(() => {
        return watchGoEvent("ping:response", (res) => {
            res = safeParse(res);
            setState({
                pingResult: {
                    ...stateRef.current.pingResult,
                    [res.ip]: String(Math.round(Number(res.time))) + "ms",
                },
            });
        });
    }, []);

    return (
        <div className={cx(S.nodeBox)}>
            <div
                className={cx(
                    "pl10 pr10 pt8 pb8 fs12 no-select pointer",
                    S.sub,
                    isSelected && S.selected,
                )}
                onClick={() => setState({ expand: !state.expand })}
            >
                <span className={cx(S.title, "b")}>
                    {props.title}: {sub.servers.length || 0}
                </span>
                <MoreEditView data={props.editList} />
            </div>
            {state.expand && (
                <div className={S.seversBox}>
                    {sub.servers.map((ele, index) => (
                        <ServerNodeView
                            key={ele.lemon2id}
                            index={index}
                            i={ele}
                            ping={
                                props.showPing &&
                                state.pingResult[ele.setting.add]
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function filterSub(sub, search) {
    return {
        ...sub,
        servers: sub.servers.filter((i) => {
            return i.ps.toLowerCase().includes(search.toLowerCase());
        }),
    };
}

export function ServerView() {
    const appState = useAppState();
    const { state, setState } = useBetterState({
        showPing: false,
        search: "",
    });

    const manualSub = {
        servers: appState.manualConfig.map((i) => {
            return { ...i, manual: true };
        }),
    };

    const handlePing = () => {
        const info = getAllVmess()
            .map((i) =>
                [i.setting?.add, i.setting?.port].filter((i) => i).join(":"),
            )
            .filter((i) => i)
            .join(",");
        if (!info) return;
        callGo("ping", info); //1
        setState({ showPing: true });
    };

    useEffect(() => {
        handlePing();
    }, []);

    return (
        <>
            <div className={cx(S.listBox, "no-select no-scrollbar")}>
                <div className={S.searchBox}>
                    <Form value={state} onChange={setState} className="ui-flex">
                        <Input
                            className="ui-flex1 br6"
                            placeholder="🔍 Search"
                            name="search"
                        />
                    </Form>
                </div>
                <ServerListView
                    title={
                        <span className="pointer">{language.ManualNode}</span>
                    }
                    sub={filterSub(manualSub, state.search)}
                    showPing={state.showPing}
                    key="manual"
                    editList={[
                        {
                            name: language.AddNode,
                            onClick: (d, close) => {
                                openAddModal();
                                close();
                            },
                        },
                        {
                            name: "Ping",
                            onClick: (d, close) => {
                                handlePing();
                                close();
                            },
                        },
                        {
                            name: language.AddSubscription,
                            onClick: (d, close) => {
                                handleAddSub();
                                close();
                            },
                        },
                    ]}
                />
                {appState.subscribes.map((sub) => {
                    return (
                        <ServerListView
                            title={
                                <span className="pointer">
                                    {sub.tag || language.SubscribedNodes}
                                </span>
                            }
                            key={sub.id}
                            url={sub.url}
                            sub={filterSub(sub, state.search)}
                            search={state.search}
                            showPing={state.showPing}
                            editList={[
                                {
                                    name: language.Refresh,
                                    onClick: (d, close) => {
                                        refreshServers(sub.url);
                                        Modal.success("Update success");
                                        close();
                                    },
                                },
                                {
                                    name: "Ping",
                                    onClick: (d, close) => {
                                        handlePing();
                                        close();
                                    },
                                },
                                {
                                    name: language.Edit,
                                    onClick: (d, close) => {
                                        onEditSub(sub.id);
                                        close();
                                    },
                                },
                                {
                                    name: language.Delete,
                                    onClick: (d, close) => {
                                        onDelSub(sub.id);
                                        close();
                                    },
                                },
                                {
                                    name: language.AddSubscription,
                                    onClick: (d, close) => {
                                        handleAddSub();
                                        close();
                                    },
                                },
                            ]}
                        />
                    );
                })}
                <div className={cx(S.borderTop, "ui-flex-ac pp10")}>
                    <Button className="fs12" onClick={handleAddSub}>
                        {language.AddSubscription}
                    </Button>
                </div>
            </div>
            {appState.tag && (
                <div className={cx("flex1 no-scrollbar", S.preview)}>
                    <NodeConfig
                        config={
                            getSelectNodeConfig(appState.tag, true)?.setting
                        }
                    />
                    <div className="ml10 mr10 mb10">
                        <LogView mini />
                    </div>
                </div>
            )}
        </>
    );
}

function NodeConfig({ config = {} }) {
    const [isHideID, update] = useState(true);
    const realCode = JSON.stringify(config, null, 2);
    const code = clone(config);
    code.id = String(code.id || "").replace(
        /^(.{6})(.*)(.{6})$/,
        (_, a, b, c) => a + "*".repeat(b.length) + c,
    );

    return (
        <div className="ui-flex" onClick={() => update(!isHideID)}>
            <CodeBlockView
                code={JSON.stringify(isHideID ? code : config, null, 2)}
                realCode={realCode}
                style={{ margin: "10px" }}
            />
        </div>
    );
}
