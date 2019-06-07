const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("t") === "1") {
    const links: any = document.getElementsByTagName("a");
    for (const link of links) {
        if (link.host !== window.location.host) {
            link.setAttribute("target", "_parent");
        } else {
            link.setAttribute("onclick", "window.parent.postMessage(this.href, '*'); return true;");
        }
    }
}

function setTooltip(btn: any, message: string) {
    btn.setAttribute("data-balloon", message);
    btn.setAttribute("data-balloon-visible", "");
    setTimeout(() => {
        btn.removeAttribute("data-balloon");
        btn.removeAttribute("data-balloon-visible");
    }, 1000);
}

const clipboard = new ClipboardJS(".btn-copy");
clipboard.on("success", (e) => setTooltip(e.trigger, "Copied!"));
clipboard.on("error", (e) => setTooltip(e.trigger, "Failed!"));
