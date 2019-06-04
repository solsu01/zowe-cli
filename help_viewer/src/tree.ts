interface ITreeNode {
    id: string;
    text: string;
    children: undefined | ITreeNode[];
}

let searchTimeout: number = 0;

function updateSearch() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        const searchText = $("#tree-search-input").val().toString();
        $("#jstree").jstree(true).search(searchText);
    }, 250);
}

function receiveMessage(event) {
    const nodeId = event.data.split("/").slice(-1)[0];
    $("#jstree").jstree(true).deselect_all();
    $("#jstree").jstree(true).select_node(nodeId);
    if (!$("#jstree").jstree(true).is_open(nodeId)) {
        $("#jstree").jstree(true).toggle_node(nodeId);
    }
}

function loadTree(nodes: ITreeNode[]) {
    $("#jstree").jstree({
        core: {
            animation: 0,
            check_callback: false,
            themes: {
                icons: false,
                multiple: false
            },
            data: nodes
        },
        plugins: ["search", "wholerow"],
        search: {
            show_only_matches: true,
            show_only_matches_children: true
        },
    }).on("changed.jstree", (e, data) => {
        // Change src attribute of iframe when item selected
        $("#docs-page").attr("src", `cmd_docs/${data.selected[0]}?t=1`);
    }).on("loaded.jstree", () => {
        // Select and expand root node when page loads
        const urlParams = new URLSearchParams(window.location.search);
        let nodeId = urlParams.get("p");
        nodeId = (nodeId === null) ? nodes[0].id : `${nodeId}.html`;
        $("#jstree").jstree(true).select_node(nodeId);
        $("#jstree").jstree(true).toggle_node(nodeId);
    });

    $("#tree-search-input").on("change keyup mouseup paste", updateSearch);
    window.addEventListener("message", receiveMessage, false);
}
