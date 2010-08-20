var activeTool = 'handTool';
var lastClick = {};
lastClick['x'] = null;
lastClick['y'] = null;
var uriTypes = {};
uriTypes['none'] = false;

function Notification(ttl,msg,time){
    if(!time) time=4000;
    $.gritter.add({
				// (string | mandatory) the heading of the notification
				title: ttl,
				// (string | mandatory) the text inside the notification
				text: msg,
				// (string | optional) the image to display on the left
				image: '/static/images/icons/phylobox-80.png',
				// (bool | optional) if you want it to fade out on its own or just sit there
				sticky: false, 
				// (int | optional) the time you want it to be alive for before fading out
				time: time
			});
}
function InviteCollaborator(email){
   var addUrl= "/tree/adduser";
   //=var addUrl= "/";
   params = {key:key,email:email};
   $.post(addUrl,params,function(data){
        var msg;
        if (data==200){
            msg = email+' has successfully been added to this project';
            $('#collaboratorList').append(' '+email+';');
        } else {
            msg = data;
        }
        Notification(msg,'Next time '+email+' signs in, they will find the project in their projects page.');
        return data;
    });
}


function OutputTreeImage(type){
    if (type=='png'){
        var elem = document.getElementById("tree-canvas");
        window.open(elem.toDataURL("image/png"));
    } else if (type=='svg'){
        var elem = document.getElementById("tree-canvas");
        window.open(elem.toDataURL("image/svg+xml"));
    }
}

$(document).ready(function(){
    
    $('.toolset img').hover(function(){
        $(this).css('opacity', '0.75');
        $(this).css('filter','alpha(opacity=75)');
        
    },function(){
        $(this).css('opacity', '1');
        $(this).css('filter','alpha(opacity=100)');
    });
    $('.tool').click(function(){
        $('.tool').css('border', '1px solid #1d1d1d');
        $(this).css('border', '1px solid #75a0cb');
        selectedTool = $(this).id;
    });
    $('.toggle').toggle(function(){
        $(this).css('border', '1px solid #75a0cb');
    },function(){
        $(this).css('border', '1px solid #1d1d1d');
    });
    

    $('#background_color').change(function(){
        $('body').css('background', "#"+$(this).val());
        $('body').css('background-color', "#"+$(this).val());
    });
    
    
    
    /* Set up Lower Menu buttons and functions */
    
    var activePanel = false;
    $(".panel").toggleClass("inactive");
    
	$(".option").click(function(){
        var id = $(this).attr('id');
        if ("#"+id+".subpanel" == activePanel) {
            $("#"+id+".subpanel").hide("slow");
            activePanel = false;
        } else { 
            $(".subpanel").toggleClass("active").hide();
            $("#"+id+".subpanel").show("slow");
            activePanel = "#"+id+".subpanel";
        }
	});
    
    
    
    //for saving the current project
    $("#fullscreen").click(function(){
        $(location).attr('href','/tree/fullscreen?k='+key);
    });
    
    //To add collaborators to a project, triggered by submit button
    //on email form
    $("#inviteNew").click(function(){
       var email = $('#newCollaboratorEmail').val();
       var data = InviteCollaborator(email);
       $('.subpanel').hide();
    });
    $('.OutputImg').click(function(){
        var type=this.id;
        OutputTreeImage(type);
    });
    
    $("#node_label_toggle").buttonset();
    $("#branch_label_toggle").buttonset();
            
    $(".toolset").hide();
    $("#basic").toggle();
    $("#advanced_toggle").css("text-decoration","underline");
    $("#advanced_toggle").click(function(){
        $(".toolset").hide();
        $("#basic_toggle").css("text-decoration","underline");
        $(this).css("text-decoration","none");
        $("#advanced").toggle();
        });
        
    //give basic toggle effect in tool menu
    $("#basic_toggle").click(function(){
        $(".toolset").hide();
        $("#advanced_toggle").css("text-decoration","underline");
        $(this).css("text-decoration","none");
        $("#basic").toggle();
        });
        
    //hide loading dialogs
    $('.ajax_dialog').hide();
    
    //track primaryURI changes
    $('#primaryURI').change(function(){
        var tmp =  $('#primaryURI').val();
        if (tmp != 'none'){
            phylojson['environment']['primaryuri'] = tmp;
        } else {
            phylojson['environment']['primaryuri'] = null;
        }
    });
});
