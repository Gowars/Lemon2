class DomLog {
    addDom() {
        if (this.$root) return;
        const logDiv = document.createElement('div');
        this.$root = logDiv;
        logDiv.style.cssText += `
            position: fixed;
            z-index: 100000;
            top: 0;
            width: 100%;
            height: 100px;
            background: rgba(255, 0, 0, .3);
            pointer-events: none;
            color: #000;
        `;
        document.body.appendChild(logDiv);
    }

    log(xxx) {
        this.addDom();
        this.$root.textContent = xxx;
    }
}

export const domLogger = new DomLog();
