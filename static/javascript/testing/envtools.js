var EnvTools = Class.extend({
    _env: null,
    //how to change the tree.title variable?
	init:function(env) {
            this._env = env;
            //set listener for background color
            $('#background_color').change(
                function(){
                    this._env.color($(this).val());
            });
            //set listener for bwidth, see imported jquery ui libraries
            //needs a few of them in the head of any current phylobox viewer page
            //will create a envtools-min.js for the widget so that we don't get
            //errors for not loading those libraries
            $(function() {
                $('.branch_width_slider').slider({	
                    value: this._env.width(),
                    min: 1,
                    max: 10,
                    step: 1,
                    slide: function(event, ui) {
                        $('#branch_width').html(ui.value);
                        this._env.width(ui.value);
                    }
                });
            });
            //set up Node Radius Slider
            $(function() {
                $('.node_radius_slider').slider({	
                    value: this._env.radius(),
                    min: 0,
                    max: 10,
                    step: 1,
                    slide: function(event, ui) {
                        $('#node_radius').html(ui.value);
                        this._env.radius(ui.value);
                    }
                });
            });
            //track primaryURI changes
            $('#primary_uri').change(function(){
                var tmp =  $('#primary_uri').val();
                if (tmp != 'none'){
                    this._env.primaryuri(tmp);
                } else {
                    this._env.primaryuri(null);
                }
            });
            //track viewtype changes
            $('#view_type').change(function(){
                var tmp =  $('#view_type').val();
                this._env.viewtype(tmp);
            });
    }
}
