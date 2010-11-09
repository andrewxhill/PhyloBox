var scripts = ["http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js",
         "static/js/jquery.tools.min.js",
         "static/js/jquery.easing.1.3.js",
         "static/js/jquery.scrollTo-1.4.2.js",
         "static/js/date.format.js",
         "static/js/jquery.hotkeys.js",
         "static/js/class.phylobox.js",
         "static/js/engine.phylobox.js",
         "static/js/main.phylobox.js"]

for (url in scripts){
    var script = document.createElement("script");
    script.id = "jquery";
    script.type = "text/javascript";
    script.setAttribute('async', 'false');
    script.src = url;
    script.onload = ();
}

