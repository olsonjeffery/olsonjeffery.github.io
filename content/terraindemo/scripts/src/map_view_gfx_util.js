(function() {
  var raycast_against = function(raw_mouse_pos, meshes, camera, cb) {
    var projector = new THREE.Projector();
    var vector = new THREE.Vector3(
      (raw_mouse_pos.x / window.innerWidth ) * 2 - 1,
      -(raw_mouse_pos.y / window.innerHeight ) * 2 + 1,
      0.1);
    projector.unprojectVector(vector, camera);
    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize(), 1, 20000);
    var intersects = ray.intersectObjects(meshes);
    cb(intersects, vector);
  };
  sugs.namespace.set(this, 'ss0.map_view.gfx.util', function(util) {
    util.raycast_against = raycast_against;
  });
}).call(this);
