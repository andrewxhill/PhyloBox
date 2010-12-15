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
//var version = "http://localhost:8080/";
var version = "http://2-0.latest.phylobox.appspot.com/";

(function() {
    var head = document.getElementsByTagName('head').item(0),
    style = document.createElement("link");
	style.type = "text/css";
	style.rel = "stylesheet";
	style.href = version+"static/css/2-0/widget.style.css";
	style.media = "screen";
	head.appendChild(style);
});
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
