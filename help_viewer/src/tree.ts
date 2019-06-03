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
            fuzzy: true,
            show_only_matches: true,
            show_only_matches_children: true
        },
    }).on("changed.jstree", (e, data) => {
        $("#docs-page").attr("src", `cmd_docs/${data.selected[0]}`);
    });

    $("#tree-search-input").on("change keyup mouseup paste", updateSearch);
    
}
