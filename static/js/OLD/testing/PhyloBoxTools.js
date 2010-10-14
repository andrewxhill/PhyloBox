var activeTool = 'handTool';
var lastClick = {};
lastClick['x'] = null;
lastClick['y'] = null;
var uriTypes = {};
uriTypes['none'] = false;

function Notification(ttl,msg){
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
				time: 5000
			});
}

function SaveTree(fork){
    
    $('#saving').show();
    var title = $('#ProjectTitle').val();
    phylojson['title'] = title;
    data = JSON.stringify(phylojson);
    
    var elem = document.getElementById("tree-canvas");
    var png = elem.toDataURL("image/png");
    
    png = JSON.stringify(png);
    if (!fork){
        params =  {key:key,tree:data,png:png,title:title}
    }else{
        params =  {key:key,tree:data,fork:"true",png:png,title:title}
    }
    //removed the real url to avoid saving in 3d for now
    $.post('/', params, function(newkey) {
        if (newkey==key){
            $(".panel").hide("slow",function(){
                activePanel = false;
            });
            Notification('Your tree has been successfully saved','If you are signed in, you will now be able to return to this tree by visiting your "projects" page at any time');
            
        } else {
            Notification('Your tree has been successfully saved','If you are signed in, you will now be able to return to this tree by visiting your "projects" page at any time');
            $(location).attr('href','/tree/edit?k='+newkey);
        }
        $('#saving').hide();
    });    
}


function InviteCollaborator(email){
   //var addUrl= "/tree/adduser";
   var addUrl= "/";
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


function NodeListClick() {
    HOVER_NODE_ID = this.id;
    var id = this.id;
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
    $("#save_now").click(function(){
        SaveTree(false);
    });
    //for saving the current project
    $("#forkButton").click(function(){
        SaveTree(true);
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
