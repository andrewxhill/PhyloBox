    var version = "localhost:8080";

    var head = document.getElementsByTagName('head').item(0);
    
    var style = document.createElement("link");
    style.type = "text/css";
    style.rel = "stylesheet";
    style.href = "http://"+version+"/static/css/widget.style.css";
    style.media = "screen";
    head.appendChild(style);
    
    
    var url = scripts[i];
    var script = document.createElement("script");
    //script.id = i;
    script.type = "text/javascript";
    script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js";
    script.onload = jQuery.noConflict();
    head.appendChild(script);
    
    
    var scripts = [
             "http://"+version+"/static/js/jquery.easing.1.3.js",
             "http://"+version+"/static/js/jquery.scrollTo-1.4.2.js",
             "http://"+version+"/static/js/date.format.js",
             "http://"+version+"/static/js/jquery.hotkeys.js",
             "http://"+version+"/static/js/class.phylobox.js",
             "http://"+version+"/static/js/engine.phylobox.js",
             "http://"+version+"/static/js/main.phylobox.js"];

    //var addScript = function(url){
    for (var i in scripts){
        var url = scripts[i];
        var script = document.createElement("script");
        //script.id = i;
        script.type = "text/javascript";
        script.src = url;
        head.appendChild(script);
    }
    
