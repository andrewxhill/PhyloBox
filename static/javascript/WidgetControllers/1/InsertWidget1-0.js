var VER = '1';
var SUB = '0';
var HOST = "phylobox.appspot.com";

if (!window.PHYLOBOX) (function() {

    var initialized = false;

    PHYLOBOX = {

        libs : { },

        globals : {
            widgetCount : 0,
            trees : [],
            pageLoaded : false,
            pageUnloaded : false,
            pageListenersLoaded : false,
            numberLibsLoaded : 0
        },
        externalLibs :[
            "/WidgetControllers/"+VER+"/TreeWidget"+VER+"-"+SUB+".js",
            "/WidgetControllers/"+VER+"/jquery.js"
        ],
        
        loadTree : function(appId,parentNodeId) {
            
            var parent = document.getElementById(parentNodeId);
            var canvas = document.createElement('canvas');
            canvas.style.height = parent.style.height;
            canvas.style.width = parent.style.width;
            canvas.id = appId
            parent.appendChild(canvas);
            
            //lookup method can also take a callback variable, get or post
            //Full URL: http://phylobox.appspot.com/lookup
            var url = "http://"+HOST+"/lookup";
            url = url+"?k="+appId+"&callback=?";
            
            $.getJSON(url,function(nodes){ 
                for(var x=0; x < nodes.length; x++) {
                    var node = nodes[x];
                    var id = node['gpe_node_id'];
                    Nodes[id] = node;
                    //see if the node is the root node
                    //root node should always be parent_gpe_id = 0
                    if (Nodes[id]["parent_gpe_id"] == 0) {
                        rootId = id;
                    }
                    if (0==node['children'].length){
                        leafNodes.push(id);
                    }
                }
                plotDendrogram(appId);
            });
        },
        
        init: function() {
        }
    };

    var self = PHYLOBOX;
    self.init();
})();

//Load Tree by Stored Tree Id
PHYLOBOX.renderWidgetInElement = function(appId, parentNodeId) {
    return PHYLOBOX.renderWidget(appId, false, parentNodeId);
},
PHYLOBOX.renderPhylo = function(appId, mode, parentNodeId) {
    
            
    parentNodeId = "phylobox_" + appId;
    document.getElementById(parentNodeId).innerHTML = "";
    //document.write("<div id=\"" + parentNodeId + "\" style=\"line-height:0\"></div>");
    document.getElementById(parentNodeId).style.width = pbWIDTH;
    document.getElementById(parentNodeId).style.height = pbHEIGHT;
    
    
    var head = document.documentElement.firstChild;
    if (!head || (head.nodeName && head.nodeName.toLowerCase().indexOf("comment")>-1)) head = document.getElementsByTagName("head")[0];
    
    function loadTree(){
        PHYLOBOX.loadTree(appId,parentNodeId);
    }
    
    for (var x=0; x < PHYLOBOX.externalLibs.length; x++){
        var script = document.createElement("script");
        script.id = "phylobox_jquery";
        script.type = "text/javascript";
        script.setAttribute('async', 'true');
        script.src = "http://"+HOST+"/static/javascript"+PHYLOBOX.externalLibs[x];
        if(x+1 == PHYLOBOX.externalLibs.length) {
            script.onload = loadTree;
        }
        head.appendChild(script);
    }
    
};

