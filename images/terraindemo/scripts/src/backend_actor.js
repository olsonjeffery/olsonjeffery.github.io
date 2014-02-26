(function() {
  var curr_actor_id = 0;
  var new_actor_id = function(owner_id) {
    var id = owner_id+"_"+curr_actor_id;
    curr_actor_id +=1;
    return id;
  };
  var new_actor = function(owner_id, name, pos, facing) {
    var next_id = new_actor_id(owner_id);
    return {
      id: next_id,
      name: name,
      owner_id: owner_id,
      pos: pos,
      facing: facing
    };
  };
  var local_ftsf = function(be_ctx, owner_id, point_pos) {
    var all_actors = be_ctx.all_actors;
    // this
    var point_man = new_actor(owner_id, "Snuffy", point_pos, 'n');
    all_actors[point_man.id] = point_man;
    var right_flank = new_actor(owner_id, "Tentpeg",
        {x:point_pos.x-2,y:point_pos.y+2}, 'w');
    all_actors[right_flank.id] = right_flank;
    var left_grenedier = new_actor(owner_id, "Gofast",
        {x:point_pos.x-2,y:point_pos.y-2}, 'w');
    all_actors[left_grenedier.id] = left_grenedier;
    var left_flank = new_actor(owner_id, "Mystery",
        {x:point_pos.x-4,y:point_pos.y-4}, 'e');
    all_actors[left_flank.id] = left_flank;
  };
  var local_vaf = function(be_ctx, client_id) {
    return _.map(be_ctx.all_actors, function(x){return x;});
  };
  sugs.namespace.set(this, 'ss0.backend.actor', function(actor) {
    actor.fire_team_stub_for = local_ftsf;
    actor.visible_actors_for = local_vaf;
  });
}).call(this);
