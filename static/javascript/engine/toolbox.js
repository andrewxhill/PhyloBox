var ToolBox = Class.extend({
    //lastX,lastY are click location, (firstX,firstY can be used later to reconstruct movement)
    _lastX: null, _lastY: null, _cid: null,_firstX: null,_firstY: null
    
	init:function(cid) {
            this._cid = cid;
            //set up a click listener on the canvas
            $("#"+cid).mousedown(
                function(e) { 
                    var position = $(this).position();
                    this._firstX = e.pageX-position.left;
                    this._firstY = e.pageY-position.top; 
                });
            //set up a click listener on the canvas
            $("#"+cid).mouseup(
                function(e) { 
                    var position = $(this).position();
                    this._lastX = e.pageX-position.left;
                    this._lastY = e.pageY-position.top; 
                });
        },
    handTool: function(node){ 
            //the real hand tool should be defined elsewhere,
            //but we can still include it here so errors aren't passed
            //if the handtool is selected
            return true;
        },
    toggleClade: function(node){
            if (node.visibility()){
                node.visibility(false);
            } else {
                node.visibility(true);
            }
        },
    editMetadata: function(node){
            alert('editMetadata: '+node.id)
        },
    paintNodes: function(node){
        var color = $('#colornode').val();
        node.color(color);
        //also change the color of the node in our taxalist
        $("li#"+node.id()).css("color","#"+color);
        
        function paintCascade(node){
            if (node.children()) {
                for (var i in node.children()) {
                    var child = node.children()[i];
                    child.color(color);
                    $("li#"+child.id()).css("color","#"+color);
                    paintCascade(child);
                }
            }
        }
        paintCascade(node);
        },
    externalLink: function(node){ 
        //get the primaryuri value, not sure where this will be in the future
        var type = $('#primaryURI').val();
        if (node.uri()){
            if(var type in node.uri()){
                //alert(Nodes[nodeId]['uri'][uri]);
                window.open(node.uri()[type], '_blank');
            } 
        }
      }
}
