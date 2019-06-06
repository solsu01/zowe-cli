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

let currentNodeId: string = null;
let isFlattened: boolean = false;
let nodeData: ITreeNode[] = [];
let searchTimeout: number = 0;

function searchTree(searchStr: string, node: any): boolean {
    if ((node.parent === "#") && !isFlattened) {
        return false;  // Don't match root node
    }

    const fullCmd: string = node.id.slice(0, -5).replace(/_/g, " ");
    const matchIndex: number = fullCmd.indexOf(searchStr);

    if (matchIndex === - 1) {
        return false;
    } else if (isFlattened) {
        return true;
    } else {
        return fullCmd.indexOf(" ", matchIndex + searchStr.length) === -1;
    }
}

function selectNode(nodeId: string, alsoExpand: boolean) {
    currentNodeId = nodeId;
    $("#cmd-tree").jstree(true).deselect_all();
    $("#cmd-tree").jstree(true).select_node(nodeId);

    if (alsoExpand) {
        $("#cmd-tree").jstree(true).open_node(nodeId);
    }

    const node = document.getElementById(nodeId);
    if (node !== null) {
        node.scrollIntoView();
    }
}

function updateSearch() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        let searchStr = $("#tree-search").val().toString().trim();
        const rootName = nodeData[0].text;

        if (searchStr.startsWith(`${rootName} `)) {
            searchStr = searchStr.slice(rootName.length).trim();
        }

        $("#cmd-tree").jstree(true).search(searchStr);
    }, 250);
}

function genFlattenedNodes(nestedNodes: ITreeNode[]): ITreeNode[] {
    const flattenedNodes: ITreeNode[] = [];
    for (const node of nestedNodes) {
        if (node.children && (node.children.length > 0)) {
            flattenedNodes.push(...genFlattenedNodes(node.children));
        } else {
            const nodeText = node.id.slice(0, -5).replace(/_/g, " ");
            flattenedNodes.push({
                id: node.id,
                text: `${nodeData[0].text} ${nodeText}`,
                children: []
            });
        }
    }
    return flattenedNodes;
}

function loadTree(nodes: ITreeNode[]) {
    nodeData = nodes;
    const urlParams = new URLSearchParams(window.location.search);

    $("#cmd-tree").jstree({
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
        if (data.selected.length > 0) {
            currentNodeId = data.selected[0];
            $("#docs-page").attr("src", `cmd_docs/${currentNodeId}?t=1`);
        }
    }).on("loaded.jstree", () => {
        // Select and expand root node when page loads
        let nodeId = urlParams.get("p");
        nodeId = (nodeId === null) ? nodes[0].id : `${nodeId}.html`;
        selectNode(nodeId, true);
    });

    if (urlParams.get("l") === "1") {
        toggleTreeView();
    }

    $("#tree-search").on("change keyup mouseup paste", updateSearch);

    window.addEventListener("message", (e) => {
        selectNode(e.data.split("/").slice(-1)[0], false);
    }, false);
}

function toggleTree(splitter: any) {
    if ($("#panel-left").is(":visible")) {
        $("#panel-left").children().hide();
        $("#panel-left").hide();
        splitter.setSizes([0, 100]);
    } else {
        splitter.setSizes([20, 80]);
        $("#panel-left").show();
        $("#panel-left").children().show();
    }
}

function toggleTreeView() {
    isFlattened = !isFlattened;
    const newNodes = isFlattened ? genFlattenedNodes(nodeData) : nodeData;
    // @ts-ignore
    $("#cmd-tree").jstree(true).settings.core.data = newNodes;
    $("#cmd-tree").jstree(true).refresh(false, true);
    setTimeout(() => selectNode(currentNodeId, true), 250);
    const otherViewName = isFlattened ? "Tree View" : "List View";
    $("#tree-view-toggle").text(`Switch to ${otherViewName}`);
    $("#tree-expand-all").toggle();
    $("#tree-collapse-all").toggle();
}

function expandAll(expanded: boolean) {
    if (expanded) {
        $("#cmd-tree").jstree("open_all");
    } else {
        $("#cmd-tree").jstree("close_all");
        $("#cmd-tree").jstree(true).toggle_node(nodeData[0].id);
    }
}
