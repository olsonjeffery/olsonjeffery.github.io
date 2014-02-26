(function() {
  var local_start = function(server_id, msgr) {
    console.log("SERVER: in backend.start()");
    be_ctx = {
      tile_size: 64,
      world_started: false,
      world: null,
      game_map: null,
      clients: {},
      all_actors: {}
    };

    msgr.sub('ss0:backend:connect', function(info, meta) {
      console.log("in ss0:backend:connect");
      // game logic stuff .. this gets pushed into
      // the intro_view's
      // handler for whatever button launches the map..
      if(!be_ctx.world_started) {
        var seed = 'ss0';
        var world_info = info.world_info;
        if(typeof(world_info) !== 'undefined') {
          if ('seed' in world_info) {
            seed = world_info.seed;
          }
        }
        be_ctx.world = new ss0.backend.game.world.WorldSim(seed);
        // let's generate a map
        var grid = {
          x: 0,
          y: 0,
          w: 256,
          h: 256
        };
        be_ctx.game_map = be_ctx.world.generate_map_for(grid.x, grid.y, grid.w, grid.h);
      }
      if(!('client_info' in info)) {
        throw "no valid client_info in request";
      }
      var ci = info.client_info;
      var client_id = meta.sender_id;
      var client_name = ci.name;
      var client_p_color = ci.primary_color;
      var client_s_color = ci.secondary_color;
      if(client_id in be_ctx.clients) {
        throw "shenanigans! someone trying to connect with the same client_id!";
      }
      be_ctx.clients[client_id] = {
        name: client_name,
        client_p_color: ci.primary_color,
        client_s_color: ci.secondary_color
      };
      console.log("client "+client_name+" connected with id "+client_id);
      var map_data = be_ctx.game_map.to_data();

      // let's generate some actors
      var point_pos = {x:127, y:127};
      ss0.backend.actor.fire_team_stub_for(be_ctx, client_id, point_pos);
      point_pos = {x:40, y:40};
      ss0.backend.actor.fire_team_stub_for(be_ctx, client_id, point_pos);
      
      msgr.pub(client_id, 'ss0:client:connected', {
        tile_size: be_ctx.tile_size,
        map:map_data,
        client_id: client_id,
        visible_actors: ss0.backend.actor.visible_actors_for(be_ctx, client_id)
      });
    });

    // the server's main loop callback
    msgr.sub('ss0:backend:main_loop', function() {
      console.log('backend heartbeat');
      msgr.pub(server_id,'ss0:backend:main_loop', {});
    });
    msgr.pub(server_id,'ss0:backend:main_loop', {});
  };
  sugs.namespace.set(this, 'ss0.backend', function(backend) {
    backend.start = local_start;
  });
}).call(this);
