
        var Nodes = {};
        var rootId = false;
        var TREE_TYPE = 'dendrogram';
        var NODE_RADIUS = 5;
        var stepX = 0;
        var stepY = 0;
        var HOVER_NODE_ID = -1;
        
        var maxDepth = 0;
        var leafNodes = [];
        
        var nodeDepths = {};
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
            for(var x=0; x < Nodes[id]['children'].length; x++) {
                var cid = Nodes[id]['children'][x]['gpe_node_id'];
                setTreeDepth(cid,nDepth);
            }
        }
        function setLeafNodes(w,h){
            x = w - 20;
            y = 20;
            var ct = leafNodes.length;
            stepY = Math.floor((h-40)/ct);
            for(var i=0; i < leafNodes.length; i++) {
                id = leafNodes[i];
                Nodes[id]['Dx'] = x;
                Nodes[id]['Dy'] = y;
                Nodes[id]['Dr'] = NODE_RADIUS;
                y = y+stepY;
            }
        }
            
        
        function setHTUNodes(w,h){
            stepX = (w-40)/maxDepth;
            var curX = w - 20 - stepX;
            
            var depth = maxDepth-1;
            while (-1<depth){
                for(var i=0; i < nodeDepths[depth].length; i++) {
                    var id = nodeDepths[depth][i];
                    if (0<Nodes[id]['children'].length){
                        var curY = 0;
                        var ct = 0;
                        for(var k=0; k < Nodes[id]['children'].length; k++) {
                            ct++;
                            var cid = Nodes[id]['children'][k]['gpe_node_id'];
                            curY = curY + Nodes[cid]['Dy'];
                        }
                        curY = curY/ct;
                        Nodes[id]['Dx'] = Math.floor(curX);
                        Nodes[id]['Dy'] = Math.floor(curY);
                        Nodes[id]['Dr'] = NODE_RADIUS;
                        
                    }
                }
                curX = curX - stepX;
                depth = depth-1;
            }
        }
        function drawDendrogram(ctx,w,h){
            
            setInterval(function(){
                ctx.fillStyle = "#333";
                ctx.fillRect(0, 0, w, h);
                var xindex = 'Dx';
                var yindex = 'Dy';
                for(var i in Nodes) {
                    if (xindex in Nodes[i]) {
                        var parent_id = Nodes[i]['parent_gpe_id'];
                        ctx.fillStyle = '#' + Nodes[i]['branch_color'];
                        ctx.strokeStyle = '#' + Nodes[i]['branch_color'];
                        //draw node
                        ctx.beginPath();
                        if (i == HOVER_NODE_ID){
                            ctx.arc(Nodes[i][xindex], Nodes[i][yindex], 2*Nodes[i]['Dr'], 0, Math.PI*2, true);
                        } else {
                            ctx.arc(Nodes[i][xindex], Nodes[i][yindex], Nodes[i]['Dr'], 0, Math.PI*2, true);
                        }
                        
                        //draw branchs
                        if (parent_id != 0){
                            if (xindex in Nodes[parent_id]) {
                                ctx.lineWidth  = 4;
                                ctx.moveTo(Nodes[i][xindex]-NODE_RADIUS, Nodes[i][yindex]);
                                ctx.lineTo(Nodes[parent_id][xindex]+20+NODE_RADIUS, Nodes[i][yindex]);
                                ctx.moveTo(Nodes[parent_id][xindex]+20+NODE_RADIUS, Nodes[i][yindex]);
                                ctx.lineTo(Nodes[parent_id][xindex]+20+NODE_RADIUS, Nodes[parent_id][yindex]);
                                ctx.moveTo(Nodes[parent_id][xindex]+20+NODE_RADIUS, Nodes[parent_id][yindex]);
                                ctx.lineTo(Nodes[parent_id][xindex]+NODE_RADIUS, Nodes[parent_id][yindex]);
                                
                            }
                        }
                            
                        ctx.stroke();
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            HOVER_NODE_ID = -1;
            }, 80);
        };
        
        
        function plotDendrogram(canvasId){
            var elem = document.getElementById(canvasId);
            var ctx = elem.getContext("2d");
            var w = elem.width;
            var h = elem.height;
            var y = 0;
            
            
            setTreeDepth(rootId,0);
            setLeafNodes(w,h);
            setHTUNodes(w,h);
            drawDendrogram(ctx,w,h);
        }
