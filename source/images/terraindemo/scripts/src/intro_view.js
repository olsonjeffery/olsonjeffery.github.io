(
    function() {
        var modal_bound = false;
        var local_init = function() {
            var setup_cb = function(mgr, outgoing_ctx, done_cb) {
                var view_ctx = {};
                //$('body').attr('style', 'background-color:#000;');
                mgr.renderer.setClearColorHex(0x000000,1);
                mgr.renderer.clear();
                var nav_id = 'intro_nav';
                var nw_gui = null;
                try {
                    nw_gui = require('nw.gui');
                } catch (x) {}
                // do intro dropout here.
                view_ctx.kh = new sugs.kb.KeyHandler();
                if (typeof(nw_gui) !== 'undefined' && nw_gui != null) {
                    var main_window = nw_gui.Window.get();
                    view_ctx.kh.on_keyup("accent", function() {
                        main_window.showDevTools();
                    });
                    view_ctx.kh.on_keyup("grave", function() {
                        main_window.showDevTools();
                    });
                }
                // STUFF THAT SHOULD BE PUSHED INTO THE WINDOW PICKER
                if (modal_bound === false) {
                    modal_bound = true;
                    $('body').append(
                        '<div id="intro_modal" class="modal" style="display:none;">'+
                        '<div class="modal-header"><h3>WebGL Terrain Demo</h3></div>'+
                        '<div class="modal-body"><p>Adjust the options below, then press the Generate button to create your terrain.</p>'+
                        '<form>'+
                        '<table><tr>'+
                        '<td><label>Seed value?</label><input id="seed_val" type="text" placeholder="hello, world!" /><span class="help-block">Using the same seed for a given noise algorithm will produce the same layout.</span></td>'+
                        '<td><label>Noise algorithm?</label><select class="uneditable_input" id="noise_type"><option value="simplex">Simplex</option><option value="perlin">Perlin</option></select><span class="help-block">Process used to generate random data for terrain.</span></td></tr>'+
                        '<tr><td><label>Tile Size?</label><select id="tile_size"><option value="32">32</option><option value="64" selected>64</option>><option value="128">128</option></select><span class="help-block">Larger tiles = smoother/flatter appearance.</span></td>'+
                        '<td><label>Zoom?</label><select id="zoom"><option value="1" selected>1x</option><option value="2" >2x</option><option value="4" >4x</option><option value="8" >8x</option></select><span class="help-block">Constant used when sampling data from random noise.</span></td></tr>'+
                        '<tr><td><label>Origin Coords</label>X: <input type="text" style="display:inline;width: 24px;" id="x_origin" placeholder="0"/> Y: <input type="text" style="display:inline; width:24px;" id="y_origin" placeholder="0"/><span class="help-block">Location, in the random noise, from which to start populating the map</span></td><td>&emsp;</td></tr>'+
                        '<tr><td colspan="2"><label class="text-warning">AFAIK This demo only works on Firefox and Chrome.</label></td></tr>'+
                        ''+
                        '</table>'+
                        '</form></div>'+
                        '<div class="modal-footer"><a href="#" id="generate_button" class="btn btn-success">Generate</a></div>'+
                        '</div>'
                    );
                    $('#generate_button').click(function(e) {
                        $('#intro_modal').hide();
                        var initial_data = {
                            grid: {
                                x: 0,
                                y: 0,
                                w: 256,
                                h: 256
                            },
                            seed: $('#seed_val').val(),
                            tile_size: parseInt($('#tile_size').val()),
                            client_id: 'player0',
                            noise_type: $('#noise_type').val(),
                            zoom: parseInt($('#zoom').val())
                        };
                        initial_data.seed = initial_data.seed === '' ?
                            "hello, world!" : initial_data.seed;
                        // create our map_view
                        var map_view = ss0.map_view.init(initial_data);
                        mgr.push_view(map_view);
                    });
                }
                $('#intro_modal').show();
                done_cb(view_ctx);
            };
            var get_kh = function(view_ctx, mgr) { return view_ctx.kh; };
            var render_cb = function(view_ctx, frametime, mgr) {return null;};
            var teardown_cb = function(view_ctx, mgr) { };
            return new sugs.ux.UxView({
                name: "intro_view",
                get_kh: get_kh,
                on_setup: setup_cb,
                on_render: render_cb,
                on_teardown: teardown_cb
            });
        };
        sugs.namespace.set(this, 'ss0.intro_view', function(intro_view) {
            intro_view.init = local_init;
        });
    }).call(this);
