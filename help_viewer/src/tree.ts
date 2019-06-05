/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

interface ITreeNode {
    id: string;
    text: string;
    children: undefined | ITreeNode[];
}

let rootName: string = null;
let searchTimeout: number = 0;

function searchTree(searchStr: string, node: any): boolean {
    if (node.parent === "#") {
        return false;  // Don't match root node
    }

    const fullCmd: string = node.id.slice(0, -5).replace(/_/g, " ");
    const matchIndex: number = fullCmd.indexOf(searchStr);

    if (matchIndex === - 1) {
        return false;
    } else {
        return fullCmd.indexOf(" ", matchIndex + searchStr.length) === -1;
    }
}

function updateSearch() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        let searchStr = $("#tree-search-input").val().toString().trim();

        if (searchStr.startsWith(`${rootName} `)) {
            searchStr = searchStr.slice(rootName.length).trim();
        }

        if (searchStr.length > 0) {
            $("#jstree").jstree(true).search(searchStr);
        }
    }, 250);
}

function updateTree(event) {
    const nodeId = event.data.split("/").slice(-1)[0];
    $("#jstree").jstree(true).deselect_all();
    $("#jstree").jstree(true).select_node(nodeId);
}

function loadTree(nodes: ITreeNode[]) {
    $("#jstree").jstree({
        core: {
            animation: 0,
            multiple: false,
            themes: {
                icons: false
            },
            data: nodes
        },
        plugins: ["search", "wholerow"],
        search: {
            show_only_matches: true,
            show_only_matches_children: true,
            search_callback: searchTree
        },
    }).on("changed.jstree", (e, data) => {
        // Change src attribute of iframe when item selected
        $("#docs-page").attr("src", `cmd_docs/${data.selected[0]}?t=1`);
    }).on("loaded.jstree", () => {
        // Select and expand root node when page loads
        rootName = nodes[0].text;
        const urlParams = new URLSearchParams(window.location.search);
        let nodeId = urlParams.get("p");
        nodeId = (nodeId === null) ? nodes[0].id : `${nodeId}.html`;
        $("#jstree").jstree(true).select_node(nodeId);
        $("#jstree").jstree(true).toggle_node(nodeId);
    });

    $("#tree-search-input").on("change keyup mouseup paste", updateSearch);
    window.addEventListener("message", updateTree, false);
}
