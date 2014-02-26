// top-level module for the whole map-view UI
(function() {
  var local_init = function(initial_data) {
    // world/map data
    var world = new ss0.backend.game.world.WorldSim(initial_data.seed, initial_data.noise_type);
    var grid = initial_data.grid;
    var game_map = world.generate_map_for(grid.x, grid.y, grid.w, grid.h,
                                         initial_data.zoom);
    var map_data = game_map.to_data();
    // pushed to the map view
    initial_data.visible_actors = [];
    var my_id = initial_data.client_id;
    var tile_size = initial_data.tile_size;
    var msgr = ss0.bridge.pure_client.create_msgr(initial_data.client_id);
    
    var get_kh = function(mv_ctx, mgr) { // kh provider
      return mv_ctx.kh;
    };
    var on_setup = function(mgr, outgoing_ctx, done_cb) { // setup
      var mv_ctx = {my_id: my_id};
  
      // PULL TO GLOBAL VIEW
      // base markup manipulation
      $('body').css({
                      'background-color': 'black'
                    });
      var container = document.createElement('div');
      document.body.appendChild(container);
  
      // END PULL TO GLOBAL VIEW

      // set up navbar
      var navbar_id = 'mv_nav';
      mv_ctx.unwinder = ss0.ux.navbar.create(navbar_id, '(c) 2014, Jeff Olson -- rotate/zoom w/ arrow keys', [
        {
          id: 'exit_link',
          type: 'link',
          loc: 'right',
          text: '<i class="icon-remove-sign icon-white"></i> Start Over',
          handler: function(e) {
            mgr.pop_view();
          }
        }
      ], true);
      mv_ctx.assets = {
        meshes: []
      };
      var camera_focus_pos = ss0.game.map_util.get_geometry_coords_for(
        map_data,
        {x: 127, y: 127},
        tile_size
      );
      
      // BEGIN ASYNC ASSET LOADING
      ss0.map_view.gfx.actor.create_actor_material('content/soldier_tex.png', function(actor_mat, actor_mat_trans) {
      // scene and cameras setup
      var gfx_ctx = ss0.map_view.gfx.init({
        map_data: map_data,
        viewport: mgr.get_viewport(),
        camera_focus_pos: camera_focus_pos,
        tile_size: tile_size,
        unwinder: mv_ctx.unwinder,
        assets: mv_ctx.assets
      });
      
      mv_ctx.scene = gfx_ctx.scene;
      mv_ctx.cameras = gfx_ctx.cameras;
      mv_ctx.cameras_state = gfx_ctx.cameras_state;
      mv_ctx.cameras.birds_eye.lookAt(mv_ctx.cameras_state.birds_eye.position);
      mv_ctx.gfx_ctx = gfx_ctx;
                                                     
      // actors
      var visible_actor_meshes = [];
      _.each(initial_data.visible_actors, function(actor) {
        var mesh_pos = ss0.game.map_util.get_geometry_coords_for(
          map_data,
          actor.pos,
          tile_size
        );
        var actor0 = ss0.map_view.gfx.actor.create_actor(actor_mat, actor_mat_trans);
        actor0.position = mesh_pos;
        actor0.rotation.y = ss0.math_util.deg2rad(ss0.game.map_util.facing[actor.facing]);
        visible_actor_meshes.push(actor0);
        mv_ctx.scene.add(actor0);
      });
      
      // keybindings, mouse, etc
      mv_ctx.map_data = map_data;
      mv_ctx.renderer_canvas_id = mgr.renderer.domElement.id;
      var map_view_kh = ss0.map_view.input_handler.init(
        {
          navbar_id: navbar_id,
          gfx_ctx: gfx_ctx
        },
        mv_ctx,
        msgr
      );
      mv_ctx.kh = map_view_kh;
      mv_ctx.cursor = {
        screen: {x: 0, y: 0},
        mouseover: {x: 0, y: 0},
        world: {x: 0, y: 0},
      };
      mv_ctx.selection = {
        happening_now: false,
        src: {x:-1, y:-1},
        dest: {x:-1, y:-1},
        done_addr: '',
      };
      ss0.map_view.actions.init(msgr, mv_ctx);
      mgr.renderer.setClearColorHex(0x99ccff, 1);
      // stats counte
      var stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.bottom = '2px';
      stats.domElement.style.right = '2px';
      $(stats.domElement).addClass('stats_container');
      container.appendChild(stats.domElement);
      mv_ctx.stats = stats;
      mv_ctx.unwinder.register_selector("#"+stats.domElement.id);
      done_cb(mv_ctx);
      });
      //END ASYNC ASSET LOADING
    };
    var on_render = function(mv_ctx, frametime, mgr) { // render loop
      // let the server process its pending messages
      // let us, the client, process any pending messages
      msgr.pump();
        
      // camera looks at the origin
      //mv_ctx.cameras.birds_eye.lookAt(
      //   mv_ctx.cameras_state.birds_eye.position);
      // update stats display
      mv_ctx.stats.update();
      // return the scene and camera that will be used to render
      // this frame
      return {
        scene: mv_ctx.scene,
        camera: mv_ctx.cameras.birds_eye
      };
    };
    var on_teardown = function(mv_ctx, mgr) { // teardown
      mv_ctx.unwinder.unwind();
      _.each(mv_ctx.scene.children, function(c) {
        mv_ctx.scene.remove(c);
      });
    };
    return new sugs.ux.UxView({
      name: "map_view",
      get_kh: get_kh,
      on_setup: on_setup,
      on_render: on_render,
      on_teardown: on_teardown
    });
  };
  sugs.namespace.set(this, 'ss0.map_view', function(map_view){
    map_view.init = local_init;
  });
}).call(this);
