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
(function() {
	var version = "http://localhost:8080/",
    //var version = "http://2-0.latest.phylobox.appspot.com/",
    head = document.getElementsByTagName('head').item(0),
    style = document.createElement("link");
	style.type = "text/css";
	style.rel = "stylesheet";
	style.href = version+"static/css/2-0/widget.style.css";
	style.media = "screen";
	head.appendChild(style);
	var script = document.createElement("script");
	head.appendChild(script);
	script.type = "text/javascript";
	script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js";
	script.onload = function() { 
        jQuery.noConflict(); 
        var scripts = [
            version+"static/js/2-0/class.phylobox.js",
            version+"static/js/2-0/main.phylobox.js",
			version+"static/js/2-0/event.phylobox.js"
        ];
        for(var i in scripts) {
            var url = scripts[i];
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = url;
            script.onload = i == scripts.length - 1 ? initialize : function() {};
            head.appendChild(script);
        }
    };
})();