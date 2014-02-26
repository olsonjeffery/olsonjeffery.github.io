(function() {
   // OVERLAY MESH
   var local_overlay_vertex_shader = [
     "varying vec4 vWorldPos;",
     "void main() {",
       "vWorldPos =  modelMatrix * vec4(position, 1.0);",
       "gl_Position = projectionMatrix * modelViewMatrix *",
       "  vec4(position, 1.0);",
     "}"
   ].join("\n");
   var local_overlay_fragment_shader = [
     "uniform float box_halfwidth;",
     "uniform vec3 highlight_box_red;",
     "uniform vec3 highlight_box_yellow;",
     "uniform vec3 highlight_box_blue;",
     "varying vec4 vWorldPos;",
     "void main() {",
       "if(highlight_box_red.x != -37.0",
         "&& vWorldPos.x > highlight_box_red.x - box_halfwidth",
         "&& vWorldPos.x < highlight_box_red.x + box_halfwidth",
         "&& vWorldPos.z < highlight_box_red.z + box_halfwidth",
         "&& vWorldPos.z > highlight_box_red.z - box_halfwidth",
         ") {",
         "gl_FragColor = vec4(7.0,0.0,0.0,0.4);",
       "} else {",
         "gl_FragColor = vec4(0.0,0.0,0.0,0.0);",
       "}",
     "}"
   ].join("\n");
   // TERRAIN MESH
   var local_terrain_vertex_shader = [
     "varying vec2 vUv;",
     "void main() {",
       "vUv = uv;",
       "gl_Position = projectionMatrix * modelViewMatrix *",
       "  vec4(position, 1.0);",
     "}"
   ].join("\n");
   var local_terrain_fragment_shader = [
     "uniform sampler2D terrain;",
     "varying vec2 vUv;",
     "void main() {",
       "gl_FragColor = vec4(texture2D(terrain, vUv).rgb, 1.0);",
     "}"
   ].join("\n");
   sugs.namespace.set(this, 'ss0.map_view.gfx.terrain.shaders', function(shaders) {
     shaders.overlay_vertex = local_overlay_vertex_shader;
     shaders.overlay_fragment = local_overlay_fragment_shader;
     shaders.terrain_vertex = local_terrain_vertex_shader;
     shaders.terrain_fragment = local_terrain_fragment_shader;
   });
}).call(this);
