//(function(){
    //var head = document.documentElement.firstChild;
    var head = document.getElementsByTagName('head').item(0);
    var scripts = [
             "http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js",
             "http://localhost:8080/static/js/jquery.easing.1.3.js",
             "http://localhost:8080/static/js/jquery.scrollTo-1.4.2.js",
             "http://localhost:8080/static/js/date.format.js",
             "http://localhost:8080/static/js/jquery.hotkeys.js",
             "http://localhost:8080/static/js/class.phylobox.js",
             "http://localhost:8080/static/js/engine.phylobox.js",
             "http://localhost:8080/static/js/main.phylobox.js"];

    //var addScript = function(url){
    for (var i in scripts){
        var url = scripts[i];
        var script = document.createElement("script");
        //script.id = i;
        script.type = "text/javascript";
        script.src = url;
        
        //script.onload = function(){
        //    console.log(this.src);
            //head.appendChild(this);
            //addScript(scripts.pop())
        //}
        head.appendChild(script);
    }
    
    //addScript(scripts.pop())
//})();
