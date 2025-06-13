/**
 * 为了解决300ms延迟之问题
 */

function fastclick(dom = document.body) {
    let startEvent;
    let isMove;

    function reset() {
        startEvent = {};
        isMove = false;
    }

    reset();

    dom.addEventListener('touchstart', (event) => {
        reset();
        startEvent = event;
    });

    dom.addEventListener('touchmove', () => {
        isMove = true;
    });

    dom.addEventListener('touchend', (event) => {
        if (!isMove) {
            event.preventDefault();
            const newEvent = new Event('love', startEvent);
            event.target.dispatchEvent(newEvent);
        }
    });
}

fastclick();
