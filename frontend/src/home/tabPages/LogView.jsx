import { useAppState } from '@/src/store'
import React, { useCallback, useEffect } from 'react'
import { interval, safeParse } from '../helper'
import { callGo } from '../core'
import { clearLog } from '../service'
import Button from '@/snake/UI/Button'
import { useBetterState } from '@/snake/useLib'
import { Form, Input } from '@/snake/UI/Form'
import S from '../index.module.scss'
import cx from '@/lemon-tools/cx'
import { copyToClipboard } from '@/lemon-tools/copyToClipboard'
import { Modal } from '@/snake/main'

class ProxyProgress {
    constructor() {
        this.info = []
    }
    parse(raw = '') {
        raw.split(/\n/).reverse().forEach(ele => {
            const id = ele.match(/\[[^\]]+\]\s+\[(\d+)\]/i)?.[1]
            if (!id) return
            let item = this.info.find(i => i.id == id)
            if (!item) {
                item = { id, progress: [] }
                this.info.push(item)
                this.info = this.info.slice(-100)
            }
            if (!item.progress.includes(ele)) {
                item.progress.push(ele)
            }
        })
        return this.toHuman([...this.info].reverse())
    }
    toHuman(list = []) {
        return list.map(i => {
            let status = '🍋'
            const text = i.progress.join('\n')
            if (text.includes(' tunneling request to ')) {
                status = '🔗'
            }
            if (text.includes(' failed to read ')) {
                status = '❌'
            }
            const line = i.progress.find(i => i.includes('default route for'))
            const PID = text.match(/request pid\s+(\d+)/)?.[1] || ''
            const appFullName = text.match(/request application name\s+(.+)/)?.[1] || ''
            const appName = appFullName.match(/([^/]+).app\//)?.[1] || appFullName.split('/').slice(-1)[0] || ''
            if (!line) return ''
            const time = line.split('[')[0].trim().split(/\s/).slice(-1)[0]
            const host = line.split(/default route for [^:]+:/)?.[1].trim()
            return {
                id: i.id,
                status,
                time,
                host,
                PID,
                appName,
                raw: text,
            }
        }).filter(i => i)
    }
}

function LogItem({ i }) {
    const copy = useCallback(() => {
        copyToClipboard(i.raw)
        Modal.success('Copy success')
    }, [i.raw])
    return <div onClick={copy} className='mt6'>
        <p>{i.status} {i.time} {i.host}</p>
        {
            !!i.PID && <p>PID:{i.PID} {i.appName}</p>
        }
    </div>
}

export function LogView({ mini = false }) {
    const { state, setState } = useBetterState({
        log: '',
        search: '',
        mode: mini,
        progress: [],
    })
    const { config } = useAppState()
    const logPath = safeParse(config)?.log?.access || ''

    const filter = (content) => {
        return content.filter(i => {
            return state.search.split('|').some(ele => i.host.includes(ele))
        }).map(i => <LogItem key={i.id} i={i} />)
    }

    useEffect(() => {
        const x = new ProxyProgress()
        return interval(() => {
            logPath && callGo('get-log', logPath).then(res => {
                const log = res.split('\n').reverse().slice(0, 1000).join('\n').trim()
                setState({
                    log,
                    progress: x.parse(log)
                })
            })
        }, { imme: true, time: 1000 })
    }, [logPath])

    const logView = <div
            className={cx('fs11 lh20 br10 pp10', S.logBox)}
        >
            <div className='ui-flex pb5'>
                <Form value={state} onChange={v => setState(v)} noRoot>
                    <Input placeholder="🔍 Search Log" name="search" className="flex1" />
                </Form>
            </div>
            {state.mode ? filter(state.progress) : state.log}
        </div>

    if (mini) {
        return logView
    }

    return <div className='pp30 flex1 w200'>
        <div className='ui-flex-a fs12 mb10'>
            <Button onClick={clearLog} className='fs12 b'>Clear Log</Button>
            <div className='ml10'>
                {logPath}
            </div>
        </div>
        {logView}
    </div>
}
