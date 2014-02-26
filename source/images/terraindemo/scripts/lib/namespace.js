(function() {
  var local_set = function(global_obj, namespace, cb) {
    var top_level = {};
    cb(top_level);
    var modules = namespace.split('.');
    if(modules.length > 0) {
	  var parent = global_obj;
      for(var ctr = 0; ctr < (modules.length - 1); ctr++) {
		var curr = modules[ctr];
        parent[curr] = parent[curr] || {};
		parent = parent[curr];
      }
      var last_module = modules[modules.length -1];
	  if (typeof(parent[last_module]) == 'undefined') {
		parent[last_module] = top_level;
	  }
	  else {
        _.each(_.keys(top_level), function(k) {
		  parent[last_module][k] = top_level[k];
		});
	  }
    }
	else {
      throw "sugs.namespace.set failure: namespace '"+namespace+"' yields a module list of zero elements. use periods to delimit.";
	}
  };
  var global = this;
  global.sugs = global.sugs || {};
  global.sugs.namespace = {
    set: local_set
  };
}).call(this);