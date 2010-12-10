/*--------------------------------------------------------------------------.
|  Software: PhyloBox Widget                                                |
|   Version: 2.0                                                            |
|   Contact: andrewxhill@gmail.com || sanderpick@gmail.com                  |
| ------------------------------------------------------------------------- |
|     Admin: Andrew Hill (project admininistrator)                          |
|   Authors: Sander Pick, Andrew Hill                                    	|                     
| ------------------------------------------------------------------------- |
|   License: Distributed under the General Public License (GPL)             |
|            http://www.gnu.org/licenses/licenses.html#GPL                  |
| This program is distributed in the hope that it will be useful - WITHOUT  |
| ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or     |
| FITNESS FOR A PARTICULAR PURPOSE.                                         |
'--------------------------------------------------------------------------*/
// locaation
var version = "http://2-0.latest.phylobox.appspot.com/";
version = "http://localhost:8080/";
// tools
var toolbar__ = '<div id="toolbar">';
toolbar__ += 		'<nav>';
toolbar__ += 			'<ul>';
toolbar__ += 				'<li><a href="javascript:;" id="select" class="tool"><img src="'+version+'static/gfx/tools/select.png" alt="select-tool" title="Select" /></a></li>';
toolbar__ += 				'<li><a href="javascript:;" id="translate" class="tool"><img src="'+version+'static/gfx/tools/translate.png" alt="translate-tool" title="Translate" /></a></li>';
toolbar__ += 				'<li style="padding-right:30px;"><a href="javascript:;" id="rotate" class="tool"><img src="'+version+'static/gfx/tools/rotate.png" alt="rotate-tool" title="Rotate" /></a></li>';
toolbar__ += 				'<li><a href="javascript:;" id="zin" class="tool"><img src="'+version+'static/gfx/tools/zin.png" alt="zoom-in-tool" title="Zoom In" /></a></li>';
toolbar__ += 				'<li><a href="javascript:;" id="zout" class="tool"><img src="'+version+'static/gfx/tools/zout.png" alt="zoom-out-tool" title="Zoom Out" /></a></li>';
toolbar__ += 				'<div class="clear"></div>';
toolbar__ += 			'</ul>';
toolbar__ += 		'</nav>';
toolbar__ += '</div>';

var head = document.getElementsByTagName('head').item(0);
style = document.createElement("link");
style.type = "text/css";
style.rel = "stylesheet";
style.href = version+"static/css/2-0/widget.style.css";
style.media = "screen";
head.appendChild(style);

if (typeof PbEvent != 'function'){
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.setAttribute('src', version+"static/js/2-0/event.phylobox.js");
    head.appendChild(script);
}
// load all scripts
var PhyloBoxInitialized = false;
PBox = function(divid, options) {
    var _this = this;
    _this._divid = divid;
    _this._options = options;
    _this.delay = 1500;
    
    
    function jQueryPBLoad(){
        if(typeof jQuery != 'function'){
            script = document.createElement("script");
            head.appendChild(script);
            script.type = "text/javascript";
            script.setAttribute('src', "http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js");
            script.onload = function() { 
                jQuery.noConflict(); 
                _this.delay = _this.delay - 400;
                classPBLoad();
            }
        }else{
            classPBLoad();
        }
    }
    
    function classPBLoad(){
        if (typeof Class != 'function'){
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.setAttribute('src', version+"static/js/2-0/class.phylobox.js");
            head.appendChild(script);
            script.onload = function() {
                _this.delay = _this.delay - 400;
                mainPBLoad();
            }
        }else{
            mainPBLoad();
        }
    }
    
    function mainPBLoad(){
        if (typeof PhyloBox != 'object'){
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.setAttribute('src', version+"static/js/2-0/main.phylobox.js");
            head.appendChild(script);
            script.onload = function() {
                _this.delay = 1;
                console.log('loaded');
                gutPBSelf();
            }
        }else{
            gutPBSelf();
        }
    }
        
    function gutPBSelf(){
        PhyloBoxInitialized = true;
        var tmpDiv = _this._divid;
        var tmpOpt = _this._options;
        _this = PhyloBox;
        var tmp = _this.Viz(tmpDiv,tmpOpt);
        _this.Viz = tmp;
    }
    
    jQueryPBLoad()
                
    if (!PhyloBoxInitialized) {
        return {
            drawTree: function(a, b){
                setTimeout(function(){
                    _this.Viz.drawTree(a,b);
                },_this.delay);
            },
            // registers an event with a PhyloBox instance
            addListener: function( t, h ) {
                setTimeout(function(){
                    _this.Viz.addListener(t,h);
                },_this.delay + 50);
            },
            // removes an event with a PhyloBox instance
            removeListener: function( t, h ) { 
                setTimeout(function(){
                    _this.Viz.removeListener(t,h);
                },_this.delay + 50);
            }
        }
    } else {
        return new PhyloBox.Viz(divid,options);
    }
};


