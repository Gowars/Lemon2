import { useAppState } from "@/src/store";
import React, { useEffect } from "react";
import { interval, safeParse } from "@/src/home/helper";
import { callGo } from "@/src/home/core";
import { AppRoute, clearLog } from "@/src/home/service";
import Button from "@/snake/UI/Button";
import { useBetterState } from "@/snake/useLib";
import { Form, Input } from "@/snake/UI/Form";
import cx from "@/lemon-tools/cx";
import { Modal } from "@/snake/main";

import S from "./index.module.scss";
import { SwitchMulti } from "../../components/SwitchMulti";
import Tag from "@/snake/UI/Tag";
import { NoDataView } from "../../components/NoData";
import { CopyView } from "../../components/CopyView";

class ProxyProgress {
    constructor() {
        this.info = [];
    }
    parse(raw = "") {
        raw.split(/\n/)
            .reverse()
            .forEach((ele) => {
                const id = ele.match(/\[[^\]]+\]\s+\[(\d+)\]/i)?.[1];
                if (!id) return;
                let item = this.info.find((i) => i.id == id);
                if (!item) {
                    item = { id, progress: [] };
                    this.info.push(item);
                    this.info = this.info.slice(-200);
                }
                if (!item.progress.includes(ele)) {
                    item.progress.push(ele);
                }
            });
        return this.toHuman([...this.info].reverse());
    }
    toHuman(list = []) {
        return list
            .map((i) => {
                if (!i.progress.length) {
                    return null;
                }
                const text = i.progress.join("\n");
                const PID = text.match(/request pid\s+(\d+)/)?.[1] || "";
                const appFullName =
                    text.match(/request application name\s+(.+)/)?.[1] || "";
                const appName =
                    appFullName.match(/([^/]+).app\//)?.[1] ||
                    appFullName.split("/").slice(-1)[0] ||
                    "";

                let host =
                    i.progress
                        .map((i) => {
                            return (
                                i.match(/request to tcp:(.+)/i)?.[1] ||
                                i.split(/default route for [^:]+:/i)?.[1]
                            );
                        })
                        .filter((i) => i)[0] || "";

                const timeRaw =
                    i.progress
                        .map((i) => {
                            return i.split("[")[0].trim();
                        })
                        .filter((i) => /^\d+\/\d/.test(i))[0] || "";

                let status = "🍋";
                if (text.includes(" failed to read ")) {
                    status = "❌";
                } else if (text.includes(" tunneling request to ")) {
                    status = "🔗";
                    if (/:443$/.test(host)) {
                        status = "🔐";
                    }
                    host = host.replace(/:(80|443)$/, "");
                }

                appName && x.add(appName)

                return {
                    id: i.id,
                    status,
                    timeRaw,
                    timeId: Number(timeRaw.replace(/\/| |:/g, "")),
                    time: timeRaw.split(/\s/).slice(-1)[0],
                    host,
                    PID,
                    appFullName,
                    appName,
                    raw: text,
                };
            })
            .filter((i) => i?.host) // 因为只分析了部分最新日志，所以可能存在没有解析到host
            .sort((a, b) => b.timeId - a.timeId);
    }
}

function LogItem({ i }) {
    return (
        <div onClick={() => openLogModal({ i })} className={cx("ptb5 plr5 br7 pointer log-item", S.logItem)}>
            <p className="fs11">
                {i.status} {i.time} {i.host}
            </p>
            {!!i.PID && (
                <div className="app-text-gray fs10">
                    <span className="mr5">PID:{i.PID}</span>
                    <span className="mr5">{i.appName}</span>
                    <LogItemStatus appName={i.appName} mini />
                </div>
            )}
        </div>
    );
}

function LineView(props) {
    return <div className="ui-flex mb10 lh20">
        <span className="app-text-gray w60 tr mr10" style={{ flexShrink: '0' }}>
            {props.title}
        </span>
        <div className="flex1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <CopyView>
                {props.children || '-'}
            </CopyView>
        </div>
    </div>
}

const x = new AppRoute()

function LogItemStatus({ appName, mini = false }) {
    const { state, setState } = useBetterState({ status: 0 })
    useEffect(() => {
        return x.get(appName, (res) => {
            setState(res)
        })
    }, [])

    const handleSet = (v) => {
        x.set(appName, v)
    }
    const data = [
        { value: 0, text: 'Proxy', theme: 'light'  },
        { value: 1, text: 'Direct', theme: 'warning'  },
        { value: 2, text: 'Block', theme: 'danger'  },
    ]
    if (mini) {
        const item = data.find(i => i.value == state.status) || data[0]
        return <Tag className="plr10 ptb3 br4" type={item?.theme}>
                {item?.text}
            </Tag>
    }

    return <div className="w180">
        <SwitchMulti
            data={data}
            value={state.status}
            onChange={handleSet}
            disabled={!appName}
        />
    </div>
}

function ModalView({ i }) {
    return <div>
        <div className={cx("ptb5 plr5 br7 pointer fs12", S.logItem)}>
            <div className="ui-flex-ac">
                <div className="flex1"></div>
                <LogItemStatus appName={i.appName} />
            </div>
            <LineView title="PID">{i.PID}</LineView>
            <LineView title="App">{i.appName}</LineView>
            <LineView title="Process">{i.appFullName}</LineView>
            <LineView title="Host">{i.host}</LineView>
            <LineView title="Time">{i.timeRaw}</LineView>
            <LineView title="Log">{i.raw}</LineView>
        </div>
    </div>
}

function openLogModal({ i }) {
    Modal.open(
        <div style={{ background: '#fff', width: '80vw', maxHeight: '85vh', overflow: 'auto' }} className="br10 pp10">
            <ModalView i={i} />
        </div>, {
        position: 'center',
        escClose: true,
        animationType: 'ss',
    })
}

export function AppRouteMannagerView() {
    const { state, setState } = useBetterState({ list: x.state })
    useEffect(() => {
        return x.getState("", (i, list) => {
            setState({ list })
        })
    }, [])
    return <div className="flex1">
        <div className="pp30">
        {state.list.length ? state.list.map((i, index) => {
            return <div key={i.app} className={cx("ui-flex-a br10 pp7", S.hover)}>
                <span className="mr5">{index + 1}.</span>
                <span className="flex1 b">{i.app}</span>
                <LogItemStatus appName={i.app} />
            </div>
        }) : <NoDataView />}
        </div>
    </div>
}

export function LogView({ mini = false }) {
    const { state, setState } = useBetterState({
        log: "",
        search: "",
        mode: mini,
        progress: [],
    });
    const { config } = useAppState();
    const logPath = safeParse(config)?.log?.access || "";

    const filter = (content) => {
        return content
            .filter((i) => {
                return state.search
                    .split("|")
                    .some((ele) => {
                        return [i.host].map(i => i.toLowerCase()).some(i => i.includes(ele.toLowerCase()))
                    });
            })
            .map((i) => <LogItem key={i.id} i={i} />);
    };

    useEffect(() => {
        const x = new ProxyProgress();
        return interval(
            () => {
                logPath &&
                    callGo("get-log", logPath).then((res) => {
                        const log = res.split("\n").reverse().join("\n").trim();
                        setState({
                            log,
                            progress: x.parse(log),
                        });
                    });
            },
            { imme: true, time: 1000 },
        );
    }, [logPath]);

    const logView = (
        <div className={cx("fs11 lh20 br10 ptb10 plr5", S.logBox)}>
            <div className="ui-flex mb10 plr5">
                <Form value={state} onChange={(v) => setState(v)} noRoot>
                    <Input
                        placeholder="🔍 Search Log"
                        name="search"
                        className="flex1"
                    />
                </Form>
            </div>
            {state.mode ? filter(state.progress) : <div className="plr5">{state.log}</div>}
        </div>
    );

    if (mini) {
        return logView;
    }

    return (
        <div className="pp30 flex1 w200">
            <div className="ui-flex-a fs12 mb10">
                <div className="w120">
                    <SwitchMulti
                        data={[{ value: false, text: 'Raw' }, { value: true, text: 'Mini' }]}
                        value={state.mode}
                        onChange={v => setState({ mode: v })}
                    />
                </div>
                <div className="flex1" />
                <div className="mr10 app-text-gray">
                    <CopyView text={logPath} />
                </div>
                <Button onClick={clearLog} className="fs12 b">
                    Clear Log
                </Button>
            </div>
            {logView}
        </div>
    );
}
