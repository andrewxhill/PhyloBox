
var pbWIDTH;
var pbHEIGHT;
window.onload = function (){
    if(document.getElementById('phylobox1')){
        var pbdiv = document.getElementById('phylobox1');
        function blogPhylobox(){
            if (PHYLOBOX) PHYLOBOX.renderPhylo();
        }
        var head = document.documentElement.firstChild;
        if (!head || (head.nodeName && head.nodeName.toLowerCase().indexOf("comment")>-1)) head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.id = "phylobox_main_js";
        script.type = "text/javascript";
        script.setAttribute('async', 'true');
        script.src = "http://phylobox.appspot.com/static/javascript/WidgetControllers/latest/InsertWidget.js";
        script.onload = blogPhylobox;
        head.appendChild(script);
    }
}
