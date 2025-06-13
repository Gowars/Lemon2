class Dayjs {
    constructor(time) {
        if (time instanceof Date) {
            this.d = time
        } else {
            this.d = time ? new Date(time) : new Date()
        }
    }
    setOffset(baseOffset  = new Date().getTimezoneOffset()) {
        const offset = (baseOffset - this.d.getTimezoneOffset() / 60) * 60 * 60 * 1000
        this.d = new Date(this.d.getTime() - offset)
        return this
    }
    clone(){
        return new Date(this.d.getTime())
    }

    /**
     * 支持 +1 -1这种方式，在现有值的基础上进行修改
     * @param {string} newV
     * @param current
     * @param defaultV
     * @returns
     */
    convert(newV, current, defaultV) {
        if (typeof newV == 'string' && /^[+-]\d+$/.test(newV)) {
            const matchM = Number(newV.match(/\d+/)[0])
            let newM = current + matchM
            if (newV.startsWith('-')) {
                newM = current - matchM
            }
            return newM
        }
        return defaultV ?? newV
    }
    setMonth(v) {
        this.d.setMonth(this.convert(v, this.d.getMonth(), v - 1))
        return this
    }
    setDate(v) {
        this.d.setDate(this.convert(v, this.d.getDate(), v))
        return this
    }
    setHMS(h, m, s) {
        this.d.setHours(h)
        this.d.setMinutes(m)
        this.d.setSeconds(s)
        this.d.setMilliseconds(0)
        return this
    }
    now() {
        return Math.floor(this.d.getTime() / 1000)
    }
}

const fill0 = (v, len = 2) => {
    v = String(v)
    if (v.length < len) {
        return `0`.repeat((len - v.length)) + v
    }
    return v
}

/**
 * 按月为粒度对数组进行分割成为二维数组，并按照时间顺序排列
 * @param {Array<any>} arr
 * @param {string} key
 * @returns
 */
export function splitMonth(arr, key) {
    const keys = {}
    arr.forEach(item => {
        const now = new Dayjs(item[key]).setOffset(3)
        const k = `${now.d.getFullYear()}${fill0(now.d.getMonth(), 2)}`
        keys[k] = keys[k] || []
        keys[k].push(item)
    })
    return Object.keys(keys).sort((a, b) => b - a).map(key => {
        return {
            key,
            list: keys[key],
        }
    })
}

// console.log(
//     splitMonth([
//         { a: Date.now(), m: '5' },
//         { a: new Dayjs().setMonth('-1').d.getTime(), m: '4' },
//         { a: new Dayjs().setMonth('-1').d.getTime(), m: '4' },
//         { a: new Dayjs().setMonth('+1').d.getTime(), m: '6' },
//         { a: new Dayjs().setMonth('+1').d.getTime(), m: '6' },
//     ], 'a')
// )
