
        var TREE_TYPE = 'dendrogram';
        var HOVER_NODE_ID = -1;
        var curMouse = false;
        
        function drawDendrogram(canvasId,ctx,w,h){
            
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
                for(var i in PHYLOBOX.globals.trees[canvasId]['tree']) {
                    var tmp = PHYLOBOX.globals.trees[canvasId]['tree'][i];
                    if (tmp[xindex]) {
                        var parent_id = PHYLOBOX.globals.trees[canvasId]['tree'][i]['parent_id'];
                        ctx.fillStyle = '#' + PHYLOBOX.globals.trees[canvasId]['tree'][i]['color'];
                        ctx.strokeStyle = '#' + PHYLOBOX.globals.trees[canvasId]['tree'][i]['color'];
                        //draw node
                        ctx.beginPath();
                        if (i == HOVER_NODE_ID){
                            ctx.arc(PHYLOBOX.globals.trees[canvasId]['tree'][i][xindex]*w, PHYLOBOX.globals.trees[canvasId]['tree'][i][yindex]*h, 2*PHYLOBOX.globals.trees[canvasId]['tree'][i]['Dr'], 0, Math.PI*2, true);
                        } else {
                            ctx.arc(PHYLOBOX.globals.trees[canvasId]['tree'][i][xindex]*w, PHYLOBOX.globals.trees[canvasId]['tree'][i][yindex]*h, PHYLOBOX.globals.trees[canvasId]['tree'][i]['Dr'], 0, Math.PI*2, true);
                        }
                        
                        //draw branchs
                        if (PHYLOBOX.globals.trees[canvasId]['tree'][parent_id] != null){
                            if (PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][xindex]) {
                                ctx.lineWidth  = 4;
                                ctx.moveTo(PHYLOBOX.globals.trees[canvasId]['tree'][i][xindex]*w-PHYLOBOX.globals.trees[canvasId]['environment']['radius'], PHYLOBOX.globals.trees[canvasId]['tree'][i][yindex]*h);
                                ctx.lineTo(PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['environment']['radius'], PHYLOBOX.globals.trees[canvasId]['tree'][i][yindex]*h);
                                ctx.moveTo(PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['environment']['radius'], PHYLOBOX.globals.trees[canvasId]['tree'][i][yindex]*h);
                                ctx.lineTo(PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['environment']['radius'], PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][yindex]*h);
                                ctx.moveTo(PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][xindex]*w+(0.01*w)+PHYLOBOX.globals.trees[canvasId]['environment']['radius'], PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][yindex]*h);
                                ctx.lineTo(PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][xindex]*w+PHYLOBOX.globals.trees[canvasId]['environment']['radius'], PHYLOBOX.globals.trees[canvasId]['tree'][parent_id][yindex]*h);
                                
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
        

        function setTreeDepth(canvasId, id,depth){
            PHYLOBOX.globals.trees[canvasId]['tree'][id]['depth'] = depth;
            
            if (PHYLOBOX.globals.trees[canvasId]['environment']['maxDepth']<depth){
                PHYLOBOX.globals.trees[canvasId]['environment']['maxDepth']=depth;
            };
            
            if (depth in PHYLOBOX.globals.trees[canvasId]['environment']['nodeDepths']){
                PHYLOBOX.globals.trees[canvasId]['environment']['nodeDepths'][depth].push(id);
            } else {
                PHYLOBOX.globals.trees[canvasId]['environment']['nodeDepths'][depth] = [];
                PHYLOBOX.globals.trees[canvasId]['environment']['nodeDepths'][depth].push(id);
            }
                
            var nDepth = depth+1;
            if (PHYLOBOX.globals.trees[canvasId]["tree"][id]["children"]){
                for(var x=0; x < PHYLOBOX.globals.trees[canvasId]["tree"][id]["children"].length; x++) {
                    var cid = PHYLOBOX.globals.trees[canvasId]["tree"][id]["children"][x]["id"];
                    setTreeDepth(canvasId, cid,nDepth);
                }
            }
        }
        
        function setLeafNodes(canvasId,w,h){
            x = 0.97;
            y = 0.03;
            var ct = PHYLOBOX.globals.trees[canvasId]['environment']['leafnodes'].length;
            stepY = (0.98)/ct;
            for(var i=0; i < PHYLOBOX.globals.trees[canvasId]['environment']['leafnodes'].length; i++) {
                var id = PHYLOBOX.globals.trees[canvasId]['environment']['leafnodes'][i];
                PHYLOBOX.globals.trees[canvasId]['tree'][id]['Dx'] = x;
                PHYLOBOX.globals.trees[canvasId]['tree'][id]['Dy'] = y;
                PHYLOBOX.globals.trees[canvasId]['tree'][id]['Dr'] = PHYLOBOX.globals.trees[canvasId]['environment']['radius'];
                y = y+stepY;
            }
        }
        function setHTUNodes(canvasId,w,h){
            stepX = (0.96)/PHYLOBOX.globals.trees[canvasId]['environment']['maxDepth'];
            var curX = 0.98 - stepX;
            
            var depth = PHYLOBOX.globals.trees[canvasId]['environment']['maxDepth']-1;
            //alert(depth);
            while (-1<depth){
                for(var i=0; i < PHYLOBOX.globals.trees[canvasId]['environment']['nodeDepths'][depth].length; i++) {
                    var id = PHYLOBOX.globals.trees[canvasId]['environment']['nodeDepths'][depth][i];
                    if (PHYLOBOX.globals.trees[canvasId]['tree'][id]['children']){
                        var curY = 0;
                        var ct = 0;
                        for(var k=0; k < PHYLOBOX.globals.trees[canvasId]['tree'][id]['children'].length; k++) {
                            ct++;
                            var cid = PHYLOBOX.globals.trees[canvasId]['tree'][id]['children'][k]['id'];
                            curY = curY + PHYLOBOX.globals.trees[canvasId]['tree'][cid]['Dy'];
                        }
                        curY = curY/ct;
                        PHYLOBOX.globals.trees[canvasId]['tree'][id]['Dx'] = (curX);
                        PHYLOBOX.globals.trees[canvasId]['tree'][id]['Dy'] = (curY);
                        PHYLOBOX.globals.trees[canvasId]['tree'][id]['Dr'] = PHYLOBOX.globals.trees[canvasId]['environment']['radius'];
                        
                    }
                }
                curX = curX - stepX;
                depth = depth-1;
            }
        }
        function plotDendrogram(canvasId){
            
            var elem = document.getElementById(canvasId);
            var ctx = elem.getContext("2d");
            var w = elem.width;
            var h = elem.height;
            //reset globals
            
            var rootId = PHYLOBOX.globals.trees[canvasId]['environment']['root'];
            if(!PHYLOBOX.globals.trees[canvasId]['environment']['radius']){
                PHYLOBOX.globals.trees[canvasId]['environment']['radius'] = 1;
            }
                
            
            HOVER_NODE_ID = -1;
            NODE_RADIUS = 5;
            
            setTreeDepth(canvasId,rootId,0);
            setLeafNodes(canvasId,w,h);
            setHTUNodes(canvasId,w,h);
            drawDendrogram(canvasId,ctx,w,h);
            
        }
