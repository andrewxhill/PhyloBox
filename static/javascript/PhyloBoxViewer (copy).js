var phylojson; 
var Nodes = {};
var rootId = false;
var maxDepth = 0;
var leafNodes = [];
var nodeDepths = {};
var TREE_TYPE = 'dendrogram';
var stepX = 0;
var stepY = 0;
var HOVER_NODE_ID = -1;
var method = 'tmp';
var Author = 'none';


function stripContents(oEle) { 
    if ( oEle.hasChildNodes() ) { while ( oEle.childNodes.length >= 1 ) { oEle.removeChild( oEle.firstChild );
} } }


function setTreeDepth(id,depth){
    Nodes[id]['depth'] = depth;
    
    if (maxDepth<depth){maxDepth=depth};
    
    if (depth in nodeDepths){
        nodeDepths[depth].push(id);
    } else {
        nodeDepths[depth] = [];
        nodeDepths[depth].push(id);
    }
        
    var nDepth = depth+1;
    //alert(id+': '+Nodes[id]['children'].length+' '+Nodes[id]['visibility']);
    if (Nodes[id]['children'] && Nodes[id]['visibility']==true) {
        for(var x=0; x < Nodes[id]['children'].length; x++) {
            var cid = Nodes[id]['children'][x]['id'];
            setTreeDepth(cid,nDepth);
        }
    }else{ 
        leafNodes.push(id);
    }
}
function setLeafNodes(w,h){
    x = 0.97;
    y = 0.03;
    var ct = leafNodes.length;
    stepY = (0.98)/ct;
    for(var i=0; i < leafNodes.length; i++) {
        id = leafNodes[i];
        Nodes[id]['Dx'] = x;
        Nodes[id]['Dy'] = y;
        Nodes[id]['Dr'] = phylojson['environment']['radius'];
        y = y+stepY;
    }
}
    

function setHTUNodes(w,h){
    stepX = (0.96)/maxDepth;
    var curX = 0.98 - stepX;
    
    var depth = maxDepth-1;
    while (-1<depth){
        for(var i=0; i < nodeDepths[depth].length; i++) {
            var id = nodeDepths[depth][i];
            if (Nodes[id]['children'] && Nodes[id]['visibility']){
                var curY = 0;
                var ct = 0;
                for(var k=0; k < Nodes[id]['children'].length; k++) {
                    ct++;
                    var cid = Nodes[id]['children'][k]['id'];
                    curY = curY + Nodes[cid]['Dy'];
                }
                curY = curY/ct;
                Nodes[id]['Dx'] = (curX);
                Nodes[id]['Dy'] = (curY);
                Nodes[id]['Dr'] = phylojson['environment']['radius'];
                
            }
        }
        curX = curX - stepX;
        depth = depth-1;
    }
}
function drawDendrogram(ctx,w,h){
    setInterval(function(){
        if(phylojson['environment']['color']){
            ctx.fillStyle = "#"+phylojson['environment']['color'];
        } else {
            phylojson['environment']['color'] = "1d1d1d";
            ctx.fillStyle = "#1d1d1d";
        }
        ctx.fillRect(0, 0, w, h);
        var xindex = 'Dx';
        var yindex = 'Dy';
        for(var i in Nodes) {
            if (xindex in Nodes[i]) {
                var parent_id = Nodes[i]['parent_id'];
                ctx.fillStyle = '#' + Nodes[i]['color'];
                ctx.strokeStyle = '#' + Nodes[i]['color'];
                //draw node
                ctx.beginPath();
                if (Nodes[i]['id'] == HOVER_NODE_ID){
                    ctx.arc(Nodes[i][xindex]*w, Nodes[i][yindex]*h, 2*phylojson['environment']['radius'], 0, Math.PI*2, true);
                } else {
                    ctx.arc(Nodes[i][xindex]*w, Nodes[i][yindex]*h, phylojson['environment']['radius'], 0, Math.PI*2, true);
                }
                if (lastClick['x'] && lastClick['y']){
                    if (lastClick['x']<Nodes[i][xindex]*w+phylojson['environment']['radius'] && Nodes[i][xindex]*w-phylojson['environment']['radius'] < lastClick['x']){
                        //alert(Nodes[i]['id']);
                        if (lastClick['y']<Nodes[i][yindex]*h+phylojson['environment']['radius'] && Nodes[i][yindex]*h-phylojson['environment']['radius'] < lastClick['y']){
                            //alert(Nodes[i]['id']);
                            TOOLBOX[activeTool](Nodes[i]['id']);
                        }
                    }
                }
                
                    
                ctx.stroke();
                ctx.fill();
                ctx.closePath();
                
                //draw branchs
                if (parent_id != null ){
                    if (xindex in Nodes[parent_id]) {
                        ctx.beginPath();
                        ctx.lineWidth  = phylojson['environment']['width'];
                        ctx.moveTo(Nodes[i][xindex]*w-phylojson['environment']['radius'], Nodes[i][yindex]*h);
                        ctx.lineTo(Nodes[parent_id][xindex]*w+(0.01*w)+phylojson['environment']['radius'], Nodes[i][yindex]*h);
                        ctx.moveTo(Nodes[parent_id][xindex]*w+(0.01*w)+phylojson['environment']['radius'], Nodes[i][yindex]*h);
                        ctx.lineTo(Nodes[parent_id][xindex]*w+(0.01*w)+phylojson['environment']['radius'], Nodes[parent_id][yindex]*h);
                        ctx.moveTo(Nodes[parent_id][xindex]*w+(0.01*w)+phylojson['environment']['radius'], Nodes[parent_id][yindex]*h);
                        ctx.lineTo(Nodes[parent_id][xindex]*w+phylojson['environment']['radius'], Nodes[parent_id][yindex]*h);
                        ctx.stroke();
                        ctx.fill();
                        ctx.closePath();
                        ctx.beginPath();
                        ctx.lineWidth  = 1;
                        ctx.arc(Nodes[parent_id][xindex]*w+(0.01*w)+phylojson['environment']['radius'], Nodes[i][yindex]*h, phylojson['environment']['width']/3, 0, Math.PI*2, true);
                        ctx.stroke();
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        }
    lastClick['x'] = null;
    lastClick['y'] = null;
    HOVER_NODE_ID = -1;
    
    if (phylojson['author']){
        ctx.fillStyle = "#e3e3e3";
        ctx.fillText(phylojson['author'].split('@')[0], 10, h-10);
    }
    }, 80);
};


function plotDendrogram(){
    var elem = document.getElementById("tree-canvas");
    var ctx = elem.getContext("2d");
    var w = elem.width;
    var h = elem.height;
    var y = 0;
    leafNodes = []
    setTreeDepth(rootId,0);
    setLeafNodes(w,h);
    setHTUNodes(w,h);
    drawDendrogram(ctx,w,h);
}

 
    

$(document).ready(function(){
    
    $('#tree-canvas').attr('width',$('body').width()*(0.56));
    
    //lookup method can also take a callback variable, get or post
    //Full URL: http://phylobox.appspot.com/lookup
    var url = "/lookup";
    var parameters = {'k': key};
    
    method = key.substring(0,3);
    $.post(url,parameters,function(pj){ 
        phylojson = JSON.parse(pj);
        var nodes = phylojson['tree'];
        rootId = phylojson['environment']['root'];
        // Do some DOM manipulation with the data contained in the JSON Object
        var leafs = document.getElementById("treenodes");
        var htus = document.getElementById("htunodes");
        for(var x=0; x < nodes.length; x++) {
            var node = nodes[x];
            var id = node['id'];
            Nodes[id] = node;
            var newli = $(document.createElement('li'));
            $(newli).attr('id',id);
            $(newli).css('color', "#"+node['color']);
            
            var inner="<span class='inline-sub'>"+id+"</span>";
            if (node['name']){
                inner = inner+"| <a>"+node['name']+"</a>";
            }
            if (node['taxonomy']){
                for (var i in node['taxonomy']){
                    var t = node['taxonomy'][i];
                    inner = inner+"| <a>"+t+"</a>";
                }
            }
            if(node['children']){
                inner = "<span class='inline-sub'>HTU</span>|"+inner;
                inner = "<div class='node' id='"+id+"'>"+inner+"</div>";
                $(newli).html(inner);
                $(newli).click(NodeListClick);
                $("#treenodes").append(newli);
            } else {
                inner = "<div class='node' id='"+id+"'>"+inner+"</div>";
                $(newli).html(inner);
                $(newli).click(NodeListClick);
                //$(newli).click(function (){ NodeListClick(id);} );
                $("#treenodes").prepend(newli);
            }
        };
        //tmp fix for new feature
        if(!phylojson['environment']['radius']){
            phylojson['environment']['radius'] = 1;
        }
        
        //Setup any dependent UI elements
        $('#BackgroundColor').val("#"+phylojson['environment']['color']);
        if(phylojson['title']){
            $('#ProjectTitle').val(phylojson['title']);
        }
        //setup node list search capabilities
        $('#nodeq').liveUpdate('#treenodes').focus();
        
        //setup branch width selecter
        $('#branch_width').html(phylojson['environment']['width']);
        $('.branch_width_slider').slider('value',[phylojson['environment']['width']]);
        
        //setup node radius selecter
        $('#node_radius').html(phylojson['environment']['radius']);
        $('.node_radius_slider').slider('value',[phylojson['environment']['radius']]);
        
        
        plotDendrogram();
    });
    
});
