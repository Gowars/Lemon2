import { useAppState } from '@/src/store'
import React, { useEffect, useState } from 'react'
import { interval, safeParse } from '../helper'
import { callGo } from '../core'
import { clearLog } from '../service'
import Button from '@/snake/UI/Button'
import { useBetterState } from '@/snake/useLib'
import { Form, Input } from '@/snake/UI/Form'
import S from '../index.module.scss'
import cx from '@/lemon-tools/cx'

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
            const text = i.progress.join('')
            if (text.includes(' tunneling request to ')) {
                status = '🔗'
            }
            if (text.includes(' failed to read ')) {
                status = '❌'
            }
            const line = i.progress.find(i => i.includes('Connect request to'))
            if (!line) return ''
            const time = line.split('[')[0].trim().split(/\s/).slice(-1)[0]
            const host = line.split(/Connect request to [^:]+:/)?.[1].trim()
            return [status, time, host].join(' ')
        }).filter(i => i).join('\n')
    }
}

export function LogView({ mini = false }) {
    const { state, setState } = useBetterState({
        log: '',
        search: '',
        mode: mini,
        progress: '',
    })
    const { config } = useAppState()
    const logPath = safeParse(config)?.log?.access || ''

    const filter = (content) => {
        return content.split(/\n/).filter(i => {
            return state.search.split('|').some(ele => i.includes(ele))
        }).join('\n')
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
            {filter(state.mode ? state.progress : state.log)}
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
