function getCurrentMonth(year, month) {
    const m = month - 1;
    const d = new Date(year, m, 1);
    let index = 1;
    const dates = [];
    while (d.getMonth() === m) {
        const DATE = d.getDate();
        dates.push({
            date: DATE,
            day: d.getDay() || 7,
            time: d.getTime(),
            month,
            year,
            ymd: [year, month, DATE].join('-'),
        });
        index += 1;
        d.setDate(index);
    }
    return dates;
}

// year++ month++
// 获取范围 startTime endTime
// currentTime
// onSelect 选择完毕
// multi多选
// 选择时间段 都可以

function getPrevMonth(year, month) {
    if (month === 0) {
        year -= 1;
        month = 12;
    }
    return getCurrentMonth(year, month);
}

function getNextMonth(year, month) {
    if (month === 13) {
        year += 1;
        month = 1;
    }
    return getCurrentMonth(year, month);
}

function getMonth(year, month) {
    return {
        current: getCurrentMonth(year, month),
        prev: getPrevMonth(year, month - 1),
        next: getNextMonth(year, month + 1),
    };
}

// 当前月份
function renderDates(year, month) {
    const months = getMonth(year, Math.min(Math.max(1, month), 12));
    const newList = [...months.current];
    const head = newList[0].day;
    const headList = months.prev.slice(-head).slice(1);
    const tail = 42 - newList.length - headList.length;
    return [...headList, ...newList, ...months.next.slice(0, tail)];
}

export { renderDates };
