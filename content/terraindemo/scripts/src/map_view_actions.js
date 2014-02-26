(function() {
    var msgr, mv_ctx;
    var on_zoom_out = function(data, meta) {
        var camera = mv_ctx.cameras.birds_eye;
        var state = mv_ctx.cameras_state.birds_eye;
        state.radius += 40;
        state.height_offset += 30;
        var camera_pos = ss0.map_view.gfx.camera.get_radial_pos(state.position, state.radius, state.view_degrees, state.height_offset);
        camera.position = camera_pos;
        camera.lookAt(state.position);
        camera.updateProjectionMatrix();
    };
    var on_zoom_in = function(data, meta) {
        var camera = mv_ctx.cameras.birds_eye;
        var state = mv_ctx.cameras_state.birds_eye;
        state.radius -= 40;
        state.height_offset -= 30;
        var camera_pos = ss0.map_view.gfx.camera.get_radial_pos(state.position, state.radius, state.view_degrees, state.height_offset);
        camera.position = camera_pos;
        camera.lookAt(state.position);
        camera.updateProjectionMatrix();
    };
    var on_rotate_counter_cw = function(data, meta) {
        var camera = mv_ctx.cameras.birds_eye;
        var state = mv_ctx.cameras_state.birds_eye;
        var camera_pos;
        state.view_degrees -= 3;
        if (state.view_degrees < 1) {
            state.view_degrees = 360 + state.view_degrees;
        }
        camera_pos = ss0.map_view.gfx.camera.get_radial_pos(state.position, state.radius, state.view_degrees, state.height_offset);
        camera.position = camera_pos;
        camera.lookAt(state.position);
    };
    var on_rotate_cw = function(data, meta) {
        var camera = mv_ctx.cameras.birds_eye;
        var state = mv_ctx.cameras_state.birds_eye;
        var camera_pos;
        state.view_degrees += 3;
        if (state.view_degrees > 359) {
            state.view_degrees = state.view_degrees % 360;
        }
        camera_pos = ss0.map_view.gfx.camera.get_radial_pos(state.position, state.radius, state.view_degrees, state.height_offset);
        camera.position = camera_pos;
        camera.lookAt(state.position);
    };
    var on_change_pos = function(data, meta) {
        var camera = mv_ctx.cameras.birds_eye;
        var meshes = mv_ctx.assets.meshes;
        var mouse_pos = data.mouse_pos;
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
                var state = mv_ctx.cameras_state.birds_eye;
                state.position = match.geometry_pos;
                var camera_pos = ss0.map_view.gfx.camera.get_radial_pos(state.position, state.radius, state.view_degrees, state.height_offset);
                camera.position = camera_pos;
                camera.lookAt(state.position);
                camera.updateProjectionMatrix();
            }
        });
    };
    var on_inactive_selection = function(match, meta) {
        mv_ctx.selection.src = {x:match.tile_pos.x, y:match.tile_pos.y};
        alert('inactive selection: '+match.tile_pos.x+", "+match.tile_pos.y);
    };
    var local_init = function(i_msgr, i_mv_ctx) {
        msgr = i_msgr;
        mv_ctx = i_mv_ctx;
        // camera movement
        msgr.sub('ss0:client:mv:action:camera:zoom_out', on_zoom_out);
        msgr.sub('ss0:client:mv:action:camera:zoom_in', on_zoom_in);
        msgr.sub('ss0:client:mv:action:camera:rotate_counter_cw', on_rotate_counter_cw);
        msgr.sub('ss0:client:mv:action:camera:rotate_cw', on_rotate_cw);
        msgr.sub('ss0:client:mv:action:camera:change_pos', on_change_pos);
        // selection-related
        msgr.sub('ss0:client:mv:action:selection:tile', on_inactive_selection);
    };
    sugs.namespace.set(this, 'ss0.map_view.actions', function(actions) {
        actions.init = local_init;
    });
}).call(this);
