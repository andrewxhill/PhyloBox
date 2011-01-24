/*--------------------------------------------------------------------------.
|  Software: PhyloBox Widget                                                |
|   Version: 2.1                                                            |
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
// placeholders
PhyloBox = (function () {
	return {
		Viz: function() {
			return {
				drawTree: function() {  },
				addListener: function() {  },
				removeListener: function() {  }
			}
		}
	};
})();
PbEvent = (function () {
	return {
		addListener: function() {  },
		removeListener: function() {  }
	}
})();
// location
//var version = "http://localhost:8080/";
var version = "http://2-0.latest.phylobox.appspot.com/";
// load all css scripts
(function() {
    var head = document.getElementsByTagName('head').item(0),
    style = document.createElement("link");
	style.type = "text/css";
	style.rel = "stylesheet";
	style.href = version+"static/css/2-0/widget.style.css";
	style.media = "screen";
	head.appendChild(style);
})();
// load all js scripts
(function(g,b,d){var c=b.head||b.getElementsByTagName("head"),D="readyState",E="onreadystatechange",F="DOMContentLoaded",G="addEventListener",H=setTimeout;
function f(){
   	$LAB
		.script( "http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js" ).wait( function () {
		//.script( version + "static/js/2-0/jquery.js" ).wait( function () {
			jQuery.noConflict();
		})
		.script( version + "static/js/2-0/main.phylobox.js" )
		.script( version + "static/js/2-0/event.phylobox.js" )
		.wait( window.onload );
}
H(function(){if("item"in c){if(!c[0]){H(arguments.callee,25);return}c=c[0]}var a=b.createElement("script"),e=false;a.onload=a[E]=function(){if((a[D]&&a[D]!=="complete"&&a[D]!=="loaded")||e){return false}a.onload=a[E]=null;e=true;f()};
a.src=version + "static/js/2-0/LAB.min.js";
c.insertBefore(a,c.firstChild)},0);if(b[D]==null&&b[G]){b[D]="loading";b[G](F,d=function(){b.removeEventListener(F,d,false);b[D]="complete"},false)}})(this,document);
// tools
var toolbar__ = '<div id="toolbar">';
toolbar__ += 		'<nav>';
toolbar__ += 			'<ul>';
toolbar__ += 				'<li><a href="javascript:;" id="select" class="tool"><img src="' + version + 'static/gfx/tools/select.png" alt="select-tool" title="Node Select" /></a></li>';
toolbar__ +=				'<li><a href="javascript:;" id="flip" class="tool"><img src="' + version + 'static/gfx/tools/flip.png" alt="flip-tool" title="Clade Flip" /></a></li>';
toolbar__ += 				'<li><a href="javascript:;" id="translate" class="tool"><img src="' + version + 'static/gfx/tools/translate.png" alt="translate-tool" title="Tree Translate" /></a></li>';
toolbar__ += 				'<li style="padding-right:30px;"><a href="javascript:;" id="rotate" class="tool"><img src="' + version + 'static/gfx/tools/rotate.png" alt="rotate-tool" title="Tree Rotate" /></a></li>';
toolbar__ += 				'<li><a href="javascript:;" id="zin" class="tool"><img src="' + version + 'static/gfx/tools/zin.png" alt="zoom-in-tool" title="Tree Zoom In" /></a></li>';
toolbar__ += 				'<li><a href="javascript:;" id="zout" class="tool"><img src="' + version + 'static/gfx/tools/zout.png" alt="zoom-out-tool" title="Tree Zoom Out" /></a></li>';
toolbar__ += 				'<div class="clear"></div>';
toolbar__ += 			'</ul>';
toolbar__ += 		'</nav>';
toolbar__ += '</div>';