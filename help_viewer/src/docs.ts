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
    $(btn).tooltip("hide").attr("data-original-title", message).tooltip("show");
}

function hideTooltip(btn: any) {
    setTimeout(() => $(btn).tooltip("hide"), 1000);
}

function initClipboard() {
    $(".btn").tooltip({
        trigger: "click",
        placement: "right"
    });

    const clipboard = new ClipboardJS(".btn");

    clipboard.on("success", (e) => {
        setTooltip(e.trigger, "Copied!");
        hideTooltip(e.trigger);
    });

    clipboard.on("error", (e) => {
        setTooltip(e.trigger, "Failed!");
        hideTooltip(e.trigger);
    });
}
