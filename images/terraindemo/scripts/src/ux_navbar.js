(function() {
  var local_create = function(id,brand,items, show) {
    show = typeof(show) === 'undefined' ? false : show;
    var unwinder = new sugs.ux.UxUnwinder();
    $.get('content/ux_navbar.html',{},function(markup) {
      // add container markup
      var nav_id = '#'+id;
      var navbar_tmpl = _.template($(markup).find('#container').html()); 
      var item_link_tmpl = _.template($(markup).find('#item_link').html()); 
      $('body').prepend(navbar_tmpl({id:id,brand:brand}));
      unwinder.register_selector(nav_id);
      if (!show) $(nav_id).hide();
      
      // iterate over the top-level items, which should be
      // menus
      _.each(items, function(item) {
        var location = item.loc == "left" ?
          '.nav_left_menu'
          : '.nav_right_menu';
        ul_selector = nav_id + " " + location;
        if (item.type == "link") {
          var item_markup = item_link_tmpl(item);
          $(ul_selector).append(item_markup);
          var item_selector = ul_selector + " #"+item.id;
          unwinder.register_event('click', item_selector, function(e) {
            e.preventDefault();
            item.handler(e);                        
          });
        } else {
          throw "malformed item provided: "+JSON.stringify(item);
        }
      });
    });
    return unwinder;
  };
  sugs.namespace.set(this, 'ss0.ux.navbar', function(navbar){
    navbar.create = local_create;
  });
}).call(this);
