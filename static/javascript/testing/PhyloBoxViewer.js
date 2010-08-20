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


$(document).ready(function(){
    
    $('#loading').show();
    $('#tree-canvas').attr('width',$('body').width()*(0.56));
    
    //lookup method can also take a callback variable, get or post
    //Full URL: http://phylobox.appspot.com/lookup
    var url = "/lookup";
    var parameters = {'k': key};
    
    method = key.substring(0,3);
    $.post(url,parameters,function(pj){ 
        phylojson = JSON.parse(pj);
        rootId = phylojson['environment']['root'];
        //Setup any dependent UI elements
        
        for(var x in phylojson.tree) {
            var node = phylojson.tree[x];
            var id = node['id'];
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
                inner = "<div class='node' id='inner-"+id+"'>"+inner+"</div>";
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
            
             if (node['uri']){
                for (var key in node['uri']){
                    uriTypes[key] = false;
                }
             }
        }
            
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
        
        InitDraw();
        $('#loading').hide();
        for (uri in uriTypes){
            $('#primaryURI').append("<option value='"+uri+"'>"+uri+"</option>");
        }
    });
    
});
