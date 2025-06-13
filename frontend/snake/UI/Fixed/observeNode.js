import RX from "@/lemon-tools/RX";


// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
const config = { attributes: true, childList: true, subtree: true };

export default function observeNode(targetNode, callback) {
    // Create an observer instance linked to the callback function
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    const realFn = RX.debounce(callback, 400);
    window.addEventListener('resize', realFn);

    // Later, you can stop observing
    return () => {
        window.removeEventListener('resize', realFn);
        observer.disconnect();
    };
}

export function observeView(node, callback) {
    let inter;
    if (window.IntersectionObserver) {
        inter = new window.IntersectionObserver(
            () => {
                callback();
            },
            { threshold: [0, 0.01, 0.99, 1] }
        );
        inter.observe(node);
    }
    return () => {
        if (inter) {
            inter.disconnect();
            inter.unobserve(node);
        }
    };
}
