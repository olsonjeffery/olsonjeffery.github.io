(function() {
  var nw_gui = null;
  try {
    nw_gui = require('nw.gui');
  } catch (x) {}
  var local_get = function(kh_ctx, mv_ctx, msgr) {
    // KEYBOARD EVENTS
    var map_view_kh = new sugs.kb.KeyHandler();
    if (typeof(nw_gui) !== 'undefined' && nw_gui !== null) {
      var main_window = nw_gui.Window.get();
      map_view_kh.on_keyup("accent", function() {
        main_window.showDevTools();
      });
      map_view_kh.on_keyup("grave", function() {
        main_window.showDevTools();
      });
    }
    map_view_kh.on_throttled_keypress("down", 60, function() {
      msgr.pub(mv_ctx.my_id,'ss0:client:mv:action:camera:zoom_out', {});
    });
    map_view_kh.on_throttled_keypress("up", 60, function() {
      msgr.pub(mv_ctx.my_id,'ss0:client:mv:action:camera:zoom_in', {});
    });
    map_view_kh.on_throttled_keypress("left", 30, function() {
      msgr.pub(mv_ctx.my_id,'ss0:client:mv:action:camera:rotate_counter_cw', {});
    });
    map_view_kh.on_throttled_keypress("right", 30, function() {
      msgr.pub(mv_ctx.my_id,'ss0:client:mv:action:camera:rotate_cw', {});
    });
    map_view_kh.on_keyup('f', function() {
      $('.stats_container').toggle();
    });

    // MOUSE EVENTS

      /*
    mv_ctx.unwinder.register_event('click', '#'+mv_ctx.renderer_canvas_id, function(event) {
      // camera pivot move
      var mouse_pos = {x:event.clientX,y:event.clientY};
      if(sugs.kb.is_keydown('control')) {
        msgr.pub(mv_ctx.my_id,'ss0:client:mv:action:camera:change_pos', {
          mouse_pos: mouse_pos
        });
      }
      // interacting with a tile/actor
      else {
        var camera = mv_ctx.cameras.birds_eye;
        var meshes = mv_ctx.assets.meshes;
        // some kind of active-selection scenario
        if(mv_ctx.selection.happening_now) {
          ss0.map_view.gfx.util.raycast_against(mouse_pos, meshes, camera, function(intersects, vector) {
            mv_ctx.cursor.screen.x = vector.x;
            mv_ctx.cursor.screen.y = vector.y;
            var map_data = mv_ctx.map_data;
            if (intersects.length > 0) {
              var coords={
                x: mv_ctx.cursor.world.x,
                y: mv_ctx.cursor.world.y
              };
              var match = ss0.game.map_util.get_tile_closest_to(map_data,coords, mv_ctx.gfx_ctx.tile_size);
              mv_ctx.selection.dest = {x:match.x, y:match.y};
              mv_ctx.selection.happening_now = false;
            }
          });
        }
        // inactive selection
        else {
          ss0.map_view.gfx.util.raycast_against(mouse_pos, meshes, camera, function(intersects, vector) {
            mv_ctx.cursor.screen.x = vector.x;
            mv_ctx.cursor.screen.y = vector.y;
            var map_data = mv_ctx.map_data;
            if (intersects.length > 0) {
              var coords={
                x: mv_ctx.cursor.world.x,
                y: mv_ctx.cursor.world.y
              };
              var match = ss0.game.map_util.get_tile_closest_to(map_data,coords, mv_ctx.gfx_ctx.tile_size);
              msgr.pub(mv_ctx.my_id,'ss0:client:mv:action:selection:tile', match);
            }
          });
        }
      }
    });
      */
      /*
    mv_ctx.unwinder.register_event('mousemove', document, function(event) {
      var camera = mv_ctx.cameras.birds_eye;
      var meshes = mv_ctx.assets.meshes;
      var mouse_pos = {x:event.clientX,y:event.clientY};
      ss0.map_view.gfx.util.raycast_against(mouse_pos, meshes, camera, function(intersects, vector) {
        mv_ctx.cursor.screen.x = vector.x;
        mv_ctx.cursor.screen.y = vector.y;
        var map_data = mv_ctx.map_data;
        if (intersects.length > 0) {
          var i = intersects[0];
          mv_ctx.cursor.world.x = i.point.x;
          mv_ctx.cursor.world.y = i.point.z;
          var match = ss0.game.map_util.get_tile_closest_to(map_data,{x:i.point.x, y:i.point.z}, mv_ctx.gfx_ctx.tile_size);
          mv_ctx.cursor.mouseover.x = match.x;
          mv_ctx.cursor.mouseover.y = match.y;

          // set selector highlight box
          mv_ctx.gfx_ctx.meshes.terrain.overlay.material.uniforms.highlight_box_red.value = match.geometry_pos;
        }
      });
    });
    */
    return map_view_kh;
  };
  sugs.namespace.set(this, 'ss0.map_view.input_handler', function(input_handler) {
    input_handler.init = local_get;
  });
}).call(this);
