import React, { useEffect, useState } from 'react'
import { callGo } from '../core'

export function AboutView() {
  const [info, set] = useState('')
  useEffect(() => {
    callGo('get-vray-info').then(res => {
      set(res)
    })
  }, [])
    return <div className='pp20 tc flex1 pt100'>
        <img src="/logo.png" alt="" className='w100 h100 no-select' />
        <p className='mt20 fs14 b'>Lemon2 0.0.1</p>
        <p className='pp10 br7 mt10 c666 fs12'>{info}</p>
    </div>
}
