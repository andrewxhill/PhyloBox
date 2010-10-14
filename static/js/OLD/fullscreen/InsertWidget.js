var VER = '1';
var SUB = '0';
//var HOST = "phylobox.appspot.com";
var HOST = "localhost:8080";

function createMenu(elem,appId,canvasId){
    var newdiv = document.createElement('div');
    $(elem).css('position','relative');
    $(newdiv).attr('id',"PhyloBox-Menu-"+canvasId);
    $(newdiv).css({'width':"100%",'min-width':"360px",'height':"27px",'background-color':'#444','float':'left','position':'relative','border':'1px solid #444','padding-top':'1px','padding-bottom':'1px'});
    
    function createButton(newdiv, appId, url, side, icon){
        var button = document.createElement('div');
        var id = "PhyloBox-"+icon+canvasId;
        $(button).attr('id',id);
        $(button).css({'float':side,'position':'relative','margin-right':'1%','margin-left':'1%','background':'#555','border':'0px','-moz-border-radius':'3px','-webkit-border-radius':'3px','height':"25px"});
        $('#'+id+' img').css({'height':'25px','margin':'0px','padding':'0px'});
        if (icon == 'embed_icon'){
            // add button and then add a sliding drawr for the button
            var tmp = $(document.createElement('img'));
            $(tmp).attr('height','25px');
            $(tmp).css({'height':'25px','padding':'0px','margin':'0px','border':'0px'});
            $(tmp).attr('src','http://phylobox.appspot.com/static/images/widget/menu/'+icon+'.png');
            $(button).append(tmp);

            var inner = document.createElement('div');
            $(inner).attr('id','inner'+icon+canvasId);
            
            $(inner).append("<div>Insert into your webpage</div>");
            var pre = $(document.createElement('pre'));
            $(pre).css({'color':'#444','width':"90%",'height':"20%",'overflow':"auto",'margin-left':"auto",'margin-right':"auto",'background':"#efffec"});
            $(pre).append('&lt;div width="400"\r\n');
            $(pre).append('     height="385"\r\n');
            $(pre).append('     style="width:400px;height:385px;"\r\n');
            $(pre).append('     id="phylobox_'+appId+'"\r\n');
            $(pre).append('     class="phylobox_embed_parent"&gt;&lt;a href="http://phylobox.appspot.com"&gt;&lt;img src="http://phylobox.appspot.com/static/images/widget/holder_425.png" width="375" height"344" /&gt;&lt;/a&gt;&lt;/div&gt;\r\n');
            $(pre).append('&lt;script type="text/javascript" src="http://phylobox.appspot.com/static/javascript/WidgetControllers/latest/InsertWidget.js"&gt;&lt;/script&gt;&lt;script type="text/javascript"&gt;if (PHYLOBOX) PHYLOBOX.renderPhylo();&lt;/script&gt;&lt;noscript&gt;Sorry, we have not spent much time with IE, maybe that is why you are not seeing anything here?&lt;/noscript&gt;\r\n');
            $(pre).append(' ');
            $(inner).append(pre);
            
            
            $(inner).append("<div>Insert into your blog *<br></div>");
            var pre = $(document.createElement('pre'));
            $(pre).css({'color':'#444','width':"90%",'height':"20%",'overflow':"auto",'margin-left':"auto",'margin-right':"auto",'background':"#efffec"});
            $(pre).append('&lt;div id="PhyloboxEmbed" &gt; \r\n');
            $(pre).append('    &lt;div width="375" height="344" style="width:375px;height:344px;" id="phylobox_'+appId+'" class="phylobox_embed_parent"&gt;&lt;a href="http://phylobox.appspot.com"&gt;&lt;img src="http://phylobox.appspot.com/static/images/widget/holder_425.png" width="375" height"344" /&gt;&lt;/a&gt;\r\n');
            $(pre).append('    &lt;/div&gt; \r\n');
            $(pre).append('&lt;/div&gt; \r\n');
            $(pre).append(' ');   
            $(inner).append(pre);
            
            
            $(inner).append('<div style="width: 100%"><sub style="float:right;width:85%;">* if this is the first time you have embedded in your blog, you need to install our gadget first. <a style="color:#ddd" href="http://phylobox.appspot.com/help/blogger" >Click Here</a></sub></div>');

            $(inner).css({'padding-left':'1px','color':'#eee','position':"absolute",'left':"0",'top':"0",'height':$('#'+canvasId).height(),'width':$('#'+canvasId).width(),'min-width':"300px",'display':"none",'background':"#333"});
            
            
            
            $(elem).append(inner);
            $(button).click(function() {
                $(inner).toggle('slow');
              });
        } else {
            var tmp = $(document.createElement('img'));
            $(tmp).attr('height','25px');
            $(tmp).css({'height':'25px','padding':'0px','margin':'0px','border':'0px'});
            $(tmp).attr('src','http://phylobox.appspot.com/static/images/widget/menu/'+icon+'.png');
            var a = $(document.createElement('a'));
            $(a).css({'border':'0px'});
            $(a).attr('href',url);
            $(a).attr('target','_blank');
            $(a).append($(tmp));
            $(button).append($(a));
        }
        $(button).hover(function(){$(button).css('background','#888') },function(){$(button).css('background','#555') } );
        
        //return button;
        $(newdiv).append(button)
    }
    
    createButton(newdiv, appId ,'http://phylobox.appspot.com/tree/fullscreen?k='+appId, 'left', 'fullscreen_icon');
    createButton(newdiv, appId,'http://phylobox.appspot.com/tree/embed?k='+appId, 'left', 'embed_icon');
    createButton(newdiv, appId,'http://phylobox.appspot.com/', 'right', 'phylobox_icon');
    createButton(newdiv, appId,'http://phylobox.appspot.com/tree/edit?k='+appId, 'right', 'explore_icon');

    
    $(elem).append(newdiv);
    $(elem).append("<br>");
}
if (!window.PHYLOBOX) (function() {

    var initialized = false;

    PHYLOBOX = {

        globals : {
            widgetCount : 0,
            trees : {},
            pageLoaded : false,
            pageUnloaded : false,
            pageListenersLoaded : false,
            numberLibsLoaded : 0
        },
        externalLibs :[
            "/WidgetControllers/latest/TreeWidget.js",
            "/WidgetControllers/latest/jquery.js"
        ],
        loadTrees : function() {
            var fullscreen = false;
            
            $('div.phylobox_embed_parent').each(function(){
                var pbHEIGHT = $(this).attr('height');
                var pbWIDTH = $(this).attr('width');
                var parent = this.id;
                var appId;
                
                var tmp = parent.split("_");
                appId = tmp[1];
  
                this.innerHTML = ""
                //var parent = document.getElementById(parentNodeId);
                var canvas = document.createElement('canvas');
                var canvasId = appId+"n"+self.globals.widgetCount;
                canvas.id = canvasId;
                
                $(canvas).attr('height', pbHEIGHT);
                $(canvas).attr('width', pbWIDTH);
                $(canvas).css('float', 'left');
                $(canvas).css('border','1px solid #444');
                
                $(this).append(canvas);
                
                //draw the menu on the lower border of the canvas
                createMenu(this,appId,canvasId);
                
                self.globals.widgetCount++;
                
                //lookup method can also take a callback variable, get or post
                //Full URL: http://phylobox.appspot.com/lookup
                
                var url = "http://"+HOST+"/lookup"+"?k="+appId+"&callback=?";
                var tmpNodes = {}
                var tmpRootId = false;
                var tmpLeafNodes = [];
                
                self.globals.trees[canvasId] = {};
                $.getJSON("http://"+HOST+"/lookup"+"?k="+appId+"&callback=?",function(phylojson){
                    self.globals.trees[canvasId] = phylojson;
                    InitDraw(canvasId);
                });
            });
        },
        
        init: function() {
        }
    };

    var self = PHYLOBOX;
    self.init();
})();

function loadAll(){
    PHYLOBOX.loadTrees();
}

//Load Tree by Stored Tree Id
PHYLOBOX.renderWidgetInElement = function(appId, parentNodeId) {
    return PHYLOBOX.renderWidget(appId, false, parentNodeId);
},
PHYLOBOX.renderPhylo = function() {
    var head = document.documentElement.firstChild;
    if (!head || (head.nodeName && head.nodeName.toLowerCase().indexOf("comment")>-1)) head = document.getElementsByTagName("head")[0];
    
    for (var x=0; x < PHYLOBOX.externalLibs.length; x++){
        var script = document.createElement("script");
        script.id = "phylobox_jquery";
        script.type = "text/javascript";
        script.setAttribute('async', 'true');
        script.src = "http://"+HOST+"/static/javascript"+PHYLOBOX.externalLibs[x];
        if(x+1 == PHYLOBOX.externalLibs.length) {
            script.onload = loadAll;
        }
        if (PHYLOBOX.globals.numberLibsLoaded<PHYLOBOX.externalLibs.length){
            head.appendChild(script);
        }
        PHYLOBOX.globals.numberLibsLoaded++;
    }
};

