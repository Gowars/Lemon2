import { dispatchApp, getAppState, setAppState, useAppState } from '@/src/store'
import { useBetterState } from '@/snake/useLib/index.jsx'
import React, { useEffect } from 'react'

import S from './index.module.scss'
import cx from '@/lemon-tools/cx'
import { callGo } from './core.js'
import { createQRCode, getSelectNodeConfig, showSelectedSever } from './service'
import { interval, sleep } from './helper'
import { ServerView } from './tabPages/ServerView'
import { ConfigureView } from './tabPages/ConfigureView'
import { CodeBlockView } from './components/CodeBlockView'
import { CopyProxyView } from './tabPages/CopProxyView'
import { LogView } from './tabPages/LogView'
import { AboutView } from './tabPages/AboutView'
import { SwitchMulti } from './components/SwitchMulti'
import { PacView } from './tabPages/PacView'
import { NetStatView } from './components/NetStatView'
import { language } from '../ i18n/en'

const TabEnmu = {
    CONFIG: 'CONFIG',
    V2RAY: 'V2RAY',
    SERVER: 'SERVER',
    MANUAL: 'MANUAL',
    PacView: 'PacView',
    CopyProxy: 'CopyProxy',
    ABOUT: 'ABOUT',
    Log: 'Log',
    ShareQR: 'ShareQR',
}

const tabs = [
    { name: '🍋 Servers', id: TabEnmu.SERVER, View: ServerView },
    { name: '🛠️ Configure', id: TabEnmu.CONFIG, View: ConfigureView},
    { name: '📖 View V2ray Config', id: TabEnmu.V2RAY, View: () => {
      const appState = useAppState()
      return <CodeBlockView theme="themeFull" code={appState.config || '\n\n\n\n'} />
    }},
    { name: '🛞 View Pac Config', id: TabEnmu.PacView, View: PacView},
    { name: '🍒 Copy Proxy', id: TabEnmu.CopyProxy, View: CopyProxyView},
    { name: '📋 Log', id: TabEnmu.Log, View: LogView },
    { name: '📱 Share QR Code', id: TabEnmu.ShareQR},
    { name: '✌️ About', id: TabEnmu.ABOUT, View: AboutView },
]

const pacTabs = [
    { value: 'global', text: 'Global', desc: language.IgnorePacRulesAndForceProxyMode },
    { value: 'proxy', text: 'Proxy', desc: language.PacUsesProxyByDefaultSetPacDirectRulesToSpecifyDomainsThatDoNotUseProxy },
    { value: 'direct', text: 'Direct', desc: language.PacDoesNotUseProxyByDefaultSetPacProxyRulesToSpecifyDomainsThatUseProxy },
    { value: 'off', text: 'OFF', desc: language.DisableProxy },
]

export function Page() {
    const appState = useAppState()
    const { state, setState } = useBetterState({ tab: tabs[0].id })

    const handlePacToggle = (v) => {
        setAppState({ pacMode: v })
    }

    useEffect(()=> {
        callGo('get-save-all').then((res) => {
            setAppState(JSON.parse(res))
        })
        callGo('get-system-info').then(res => {
            setAppState(JSON.parse(res))
        })
        dispatchApp({ type: 'getConfig' })

        // 定时check v2ray是否还在运行，如果挂了就自动启动
        return interval(() => {
            callGo('check-is-run')
                .then((result) => {
                  const { pacMode } = getAppState()
                  if (!result) {
                    callGo(pacMode)
                  }
                })
        }, { time: 10 * 1000 })
    }, [])

    useEffect(() => {
        appState.pacMode && callGo('pac-mode-change', appState.pacMode)
    }, [appState.pacMode])

    const handleTabChange = (tab) => () => {
        if (tab == TabEnmu.ShareQR) {
            createQRCode()
            return
        }
        setState({ tab })
        if (tab == TabEnmu.CONFIG) {
            dispatchApp({ type: 'getConfig' })
        }
    }
    const handleLogoClick = async () => {
        // 切换节点tab，并自动定位到当前节点
        if (state.tab !== TabEnmu.SERVER) {
            handleTabChange(TabEnmu.SERVER)()
            await sleep(80) // wait dom updated
        }
        showSelectedSever()
    }

    const Ele = tabs.find(i => i.id == state.tab)?.View

    return <div className={S.app}>
      <div className={cx(S.sidebar, 'no-select')}>
          <div className='flex-cc tc mt10'>
              <span
                className={cx('c333 fs11 b pointer')}
                onClick={handleLogoClick}
              >{getSelectNodeConfig(appState.tag)?.ps?.trim() || 'Unkown'}</span>
              {/* <div style={{ flexShrink: '0' }}>
                  <SwitchCore value={appState.on} onChange={handleToggle} />
              </div> */}
          </div>
          <div className='mb20 mt10 fs10'>
              <SwitchMulti
                  data={pacTabs}
                  value={appState.pacMode}
                  onChange={handlePacToggle}
              />
          </div>
          <div>
              {tabs.map(i => {
                  return <div
                      className={cx(S.sidebarItem, i.id == state.tab && S.active)}
                      key={i.id}
                      onClick={handleTabChange(i.id)}
                  >{i.name}</div>
              })}
          </div>
          <div className={S.bottomPannel}>
            <NetStatView />
          </div>
      </div>
      <div className='flex1 ui-flex' style={{ height: '100vh', overflow: 'auto' }}>
          {!!Ele && <Ele />}
      </div>
    </div>
}
