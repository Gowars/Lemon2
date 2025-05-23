import React, { useEffect, useState } from 'react'
import { callGo } from '../core'

const url = 'https://github.com/Gowars/Lemon2'

export function AboutView() {
  const [info, set] = useState('')
  useEffect(() => {
    callGo('get-vray-info').then(res => {
      set(res)
    })
  }, [])

    return <div className='pp20 flex1 tc pt100'>
        <img src="/logo.png" alt="" className='w100 h100 no-select' />
        <p className='mt20 fs14 b'>Lemon2 0.0.1</p>
        <p className='mt6 pointer' onClick={() => callGo('open-url', url)}>{url}</p>
        <p className='mt10 br7 mt10 c888 fs12 pp10'>{info}</p>
    </div>
}
