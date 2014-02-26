(function() {
  var local_create = function(mv_ctx, unwinder) {
    $.get('content/map_view_ux_sidebar.html', function(markup) {
    });
  };
  sugs.namespace.set(this, 'ss0.map_view.ux.sidebar', function(sidebar) {
    sidebar.create = local_create;
  });
}).call(this);
