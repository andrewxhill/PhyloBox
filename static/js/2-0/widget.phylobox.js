(function() {    
	
	// var args;
	// 
	// PhyloBox = function() {
	// 		
	// 		args = arguments;
	// 		
	// 	}
	
	var version = "http://localhost:8080",
		head = document.getElementsByTagName('head').item(0),
		style = document.createElement("link");

	style.type = "text/css";
	style.rel = "stylesheet";
	style.href = version+"/static/css/2-0/widget.style.css";
	style.media = "screen";
	
	head.appendChild(style);

	var script = document.createElement("script");
	script.type = "text/javascript";
	script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js";
	script.onload = function() { jQuery.noConflict(); };
	head.appendChild(script);

	var scripts = [
		version+"/static/js/2-0/class.phylobox.js",
	    version+"/static/js/2-0/main.phylobox.js"
	];

	for(var i in scripts) {
	    var url = scripts[i];
	    var script = document.createElement("script");
	    script.type = "text/javascript";
	    script.src = url;
		if(i==scripts.length-1) script.onload = initialize;
	    head.appendChild(script);
	}
    
	//otherFunc.apply(this, arguments);
    
})();