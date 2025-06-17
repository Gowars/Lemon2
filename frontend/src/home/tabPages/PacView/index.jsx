import React, { useEffect, useRef } from "react";

import { callGo } from "@/src/home/core.js";
import { CodeBlockView } from "@/src/home/components/CodeBlockView";
import { useBetterState } from "@/snake/useLib/index.jsx";
import { useAppState } from "@/src/store/index.js";
import Button from "@/snake/UI/Button";
import { Form, Input } from "@/snake/UI/Form";
import { language } from "@/src/i18n";
import { FieldView } from "../../components/FieldView";

function runCode(fnArgs = [], fnBody = '', realArgs = []) {
    return new Function(...fnArgs, fnBody)(...realArgs.slice(0, fnArgs.length))
}

export function PacView() {
    const { state, setState } = useBetterState({
        code: "\n\n\n\n",
        result: '',
        host: '',
    });
    const { pacPort } = useAppState();

    useEffect(() => {
        callGo("get-pac-content").then((res) => {
            setState({
                code: res,
            });
        });
    }, []);
    const test = () => {
        const res = runCode(
            ['testHost'],
            [state.code, 'return { proxy: FindProxyForURL(testHost, testHost), whichRuleIsWork, }'].join('\n'),
            [state.host]
        )
        setState({ result: res })
    }

    return (
        <div className="pp30 flex1 w200">
            <FieldView title={language.VerifyWhichRuleTheDomainNameHits}>
                <div className="flex1">
                    <div className="ui-flex">
                    <Form noRoot value={state} onChange={setState}>
                        <Input className="flex1" name="host" placeholder="Host name" />
                        <Button className="ml10" onClick={test}>Run</Button>
                    </Form>
                    </div>
                    {!!(state.result && state.host) && <div className="mt10 mb20">
                        <CodeBlockView
                            code={JSON.stringify(state.result, null, 4)}
                            language="json"
                        />
                    </div>}
                </div>
            </FieldView>
            <CodeBlockView
                code={state.code}
                language="javascript"
                url={"http://127.0.0.1:" + pacPort + "/proxy.js"}
            />
        </div>
    );
}
