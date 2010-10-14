function fullscreenMenus(){
    var taxa = $("#menusX");
    $(taxa).css({'bottom':50,
                 'left':10});
    $(taxa).show();
    $('#menusX').mousedown(function(e){
            var d = $(this);
            var dx = d.offset().left;
            var dy = d.offset().top;
            var xgap = e.pageX-dx;
            var ygap = e.pageY-dy;
                                if (!$.browser.msie) {
                                    e.preventDefault();
                                }
        $(document).mousemove(function(e){
            var x = e.pageX-xgap;
            var y = e.pageY-ygap;
                              if ($.browser.msie) {
                                // IE only here
                                e.preventDefault();  //IE's
                                if(e.pageX >= 0 && e.pageY >= 0) d.css({left: x, top: y });
                                return false;
                              }
                                // FF only here
                if(e.pageX >= 0 && e.pageY >= 0) d.css({left: x, top: y });
                             return true;
        });
    }).mouseup(function(e){ $(document).unbind('mousedown');$(document).unbind('mousemove');});
}

