(function() {
  var local_rad2deg = function(radians) {
    return radians * (180 / Math.PI);
  };
  var local_deg2rad = function(degrees) {
    return degrees * (Math.PI / 180);
  };
  sugs.namespace.set(this, 'ss0.math_util', function(math_util) {
    math_util.rad2deg = local_rad2deg;
    math_util.deg2rad = local_deg2rad;
  });
}).call(this);
