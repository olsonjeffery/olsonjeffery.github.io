(function() {
  var local_cr = function(input) {
	  var viewport_x = input.viewport_x;
    var viewport_y = input.viewport_y;
    var renderer = null;
    try {
	      renderer = new THREE.WebGLRenderer();
    } catch (e) {
        try {
            renderer = new THREE.CanvasRenderer();
        } catch (e) {
            alert("Unable to initial three.js renderer, sorry.");
        }
    }
    renderer.setSize(viewport_x, viewport_y);
    renderer.domElement.id = "renderer_canvas";
    document.body.appendChild(renderer.domElement);
    return renderer;	
  };

  sugs.namespace.set(this, 'ss0.gfx', function(gfx) {
    gfx.create_renderer = local_cr;
  });
}).call(this);
