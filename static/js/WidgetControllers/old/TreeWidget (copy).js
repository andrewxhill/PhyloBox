
        var TREE_TYPE = 'dendrogram';
        var HOVER_NODE_ID = -1;
        var curMouse = false;
        
        function setTreeDepth(canvasId, id,depth){
            
            PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['depth'] = depth;
            
            if (PHYLOBOX.globals.trees[canvasId]['maxDepth']<depth){PHYLOBOX.globals.trees[canvasId]['maxDepth']=depth};
            
            if (depth in PHYLOBOX.globals.trees[canvasId]['nodeDepths']){
                PHYLOBOX.globals.trees[canvasId]['nodeDepths'][depth].push(id);
            } else {
                PHYLOBOX.globals.trees[canvasId]['nodeDepths'][depth] = [];
                PHYLOBOX.globals.trees[canvasId]['nodeDepths'][depth].push(id);
            }
                
            var nDepth = depth+1;
            for(var x=0; x < PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['children'].length; x++) {
                var cid = PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['children'][x]['id'];
                setTreeDepth(canvasId, cid,nDepth);
            }
        }
        function setLeafNodes(canvasId, w,h){
            x = 0.97;
            y = 0.03;
            var ct = PHYLOBOX.globals.trees[canvasId]['leafNodes'].length;
            
            stepY = (0.98)/ct;
            
            for(var i=0; i < PHYLOBOX.globals.trees[canvasId]['leafNodes'].length; i++) {
                var id = PHYLOBOX.globals.trees[canvasId]['leafNodes'][i];
                PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['Dx'] = x;
                PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['Dy'] = y;
                PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['Dr'] = PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'];
                var y = y+stepY;
            }
        }
            
        
        function setHTUNodes(canvasId, w,h){
            var stepX = (0.96)/PHYLOBOX.globals.trees[canvasId]['maxDepth'];
            var curX = 0.98 - stepX;
            
            var depth = PHYLOBOX.globals.trees[canvasId]['maxDepth']-1;
            
            while (-1<depth){
                for(var i=0; i < PHYLOBOX.globals.trees[canvasId]['nodeDepths'][depth].length; i++) {
                    var id = PHYLOBOX.globals.trees[canvasId]['nodeDepths'][depth][i];
                    if (0<PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['children'].length){
                        var curY = 0;
                        var ct = 0;
                        for(var k=0; k < PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['children'].length; k++) {
                            ct++;
                            var cid = PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['children'][k]['id'];
                            curY = curY + PHYLOBOX.globals.trees[canvasId]['Nodes'][cid]['Dy'];
                        }
                        curY = curY/ct;
                        PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['Dx'] = curX;
                        PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['Dy'] = curY;
                        PHYLOBOX.globals.trees[canvasId]['Nodes'][id]['Dr'] = PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'];
                        
                    }
                }
                curX = curX - stepX;
                depth = depth-1;
            }
        }
        function drawDendrogram(canvasId, ctx,w,h){
            
            setInterval(function(){
                if(PHYLOBOX.globals.trees[canvasId]['environment']['color']){
                    ctx.fillStyle = "#"+PHYLOBOX.globals.trees[canvasId]['environment']['color'];
                } else {
                    PHYLOBOX.globals.trees[canvasId]['environment']['color'] = "333";
                    ctx.fillStyle = "#333";
                }
                ctx.fillRect(0, 0, w, h);
                var xindex = 'Dx';
                var yindex = 'Dy';
                for(var i in PHYLOBOX.globals.trees[canvasId]['Nodes']) {
                    if (xindex in PHYLOBOX.globals.trees[canvasId]['Nodes'][i]) {
                        var parent_id = PHYLOBOX.globals.trees[canvasId]['Nodes'][i]['parent_id'];
                        ctx.fillStyle = '#' + PHYLOBOX.globals.trees[canvasId]['Nodes'][i]['color'];
                        ctx.strokeStyle = '#' + PHYLOBOX.globals.trees[canvasId]['Nodes'][i]['color'];
                        //draw node
                        ctx.beginPath();
                        if (i == HOVER_NODE_ID){
                            ctx.arc(PHYLOBOX.globals.trees[canvasId]['Nodes'][i][xindex]*w, PHYLOBOX.globals.trees[canvasId]['Nodes'][i][yindex]*h, 2*PHYLOBOX.globals.trees[canvasId]['Nodes'][i]['Dr'], 0, Math.PI*2, true);
                        } else {
                            ctx.arc(PHYLOBOX.globals.trees[canvasId]['Nodes'][i][xindex]*w, PHYLOBOX.globals.trees[canvasId]['Nodes'][i][yindex]*h, PHYLOBOX.globals.trees[canvasId]['Nodes'][i]['Dr'], 0, Math.PI*2, true);
                        }
                        
                        //draw branchs
                        if (parent_id != 0){
                            if (xindex in PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id]) {
                                ctx.lineWidth  = 4;
                                ctx.moveTo(PHYLOBOX.globals.trees[canvasId]['Nodes'][i][xindex]*w-PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'], PHYLOBOX.globals.trees[canvasId]['Nodes'][i][yindex]*h);
                                ctx.lineTo(PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'], PHYLOBOX.globals.trees[canvasId]['Nodes'][i][yindex]*h);
                                ctx.moveTo(PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'], PHYLOBOX.globals.trees[canvasId]['Nodes'][i][yindex]*h);
                                ctx.lineTo(PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'], PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][yindex]*h);
                                ctx.moveTo(PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'], PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][yindex]*h);
                                ctx.lineTo(PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][xindex]*w+PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'], PHYLOBOX.globals.trees[canvasId]['Nodes'][parent_id][yindex]*h);
                                
                            }
                        }
                            
                        ctx.stroke();
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            HOVER_NODE_ID = -1;
            
            if (PHYLOBOX.globals.trees[canvasId]['author']){
                ctx.fillStyle = "#e3e3e3";
                ctx.fillText(PHYLOBOX.globals.trees[canvasId]['author'], 10, h-10);
            }
            }, 80);
        };
        
        
        function plotDendrogram(canvasId){
            var canvasId = canvasId;
            
            var elem = document.getElementById(canvasId);
            var ctx = elem.getContext("2d");
            var w = elem.width;
            var h = elem.height;
            //reset globals
            
            var rootId = PHYLOBOX.globals.trees[canvasId]['rootId'];
            
            PHYLOBOX.globals.trees[canvasId]['NODE_RADIUS'] = 5;
            
            HOVER_NODE_ID = -1;
            NODE_RADIUS = 5;
            
            drawDendrogram(canvasId,ctx,w,h);
            
        }
