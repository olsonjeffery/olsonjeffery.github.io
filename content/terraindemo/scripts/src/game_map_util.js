(function() {
  var calc_tile_index = function(x, y, width) {
    return x + (y * width);
  };
  var local_gt = function(self, x, y) {
    return self.grid[calc_tile_index(x, y, self.width)];
  };
  var local_gtsd = function(self, elem) {
    return self.grid[elem];
  };
  var local_st = function(self, x, y, input_tile) {
    self.grid[calc_tile_index(x, y, self.width)] = input_tile;
  };
  var local_gc = function(self) {
    return self.colors;
  };
  var local_et = function(self, cb) {
    var x, y, _i, _ref, _results;
    console.log("each_tile: is first elem in grid existant? " + (self.grid[0] !== null));
    _results = [];
    for (y = _i = 0, _ref = self.size; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
      _results.push((function() {
        var _j, _ref1, _results1;
        _results1 = [];
        for (x = _j = 0, _ref1 = self.size; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          _results1.push(cb({
            x: x,
            y: y
          }, self.grid[calc_tile_index(x, y, self.width)]));
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };
  var local_gtct = function(self, coords, tile_size) {
    var x_remainder = coords.x % tile_size;
    var x = (coords.x - x_remainder) / tile_size;
    if (x_remainder >= (tile_size/2))
      x+=1;
    var y_remainder = coords.y % tile_size;
    var y = (coords.y - y_remainder) / tile_size;
    if (y_remainder >= (tile_size/2))
      y+=1;
    return {
      tile_pos: {x:x, y:y},
      tile: local_gt(self, x, y),
      geometry_pos: local_ggcf(self, {x:x, y:y}, tile_size)
    };
  };
  var local_ggcf = function(self, tile_coords, tile_size) {
    var tile = local_gt(self, tile_coords.x, tile_coords.y);
    return {
      x: tile_coords.x * tile_size,
      y: tile.height,
      z: tile_coords.y * tile_size
    };
  };
  sugs.namespace.set(this, 'ss0.game.map_util', function(map_util) {
    map_util.get_tile = local_gt;
    map_util.get_tile_single_dim = local_gtsd;
    map_util.set_tile = local_st;
    map_util.get_colors = local_gc;
    map_util.each_tile = local_et;
    map_util.get_tile_closest_to = local_gtct;
    map_util.get_geometry_coords_for = local_ggcf;
    map_util.facing = {
      ne: 45,
      n: 90,
      nw: 135,
      w: 180,
      sw: 225,
      s: 270,
      se: 315,
      e: 360,
      NORTHEAST: 45,
      NORTH: 90,
      NORTHWEST: 135,
      WEST: 180,
      SOUTHWEST: 225,
      SOUTH: 270,
      SOUTHEAST: 315,
      EAST: 360
    };
  });
}).call(this);
