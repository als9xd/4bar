let wrapper =  $("#wrapper");
let friends_list= $('#friends')
let menu_toggle = $("#menu-toggle");
$(menu_toggle).click(function(e) {
    e.preventDefault();
    wrapper.toggleClass("toggled");
    friends_list.toggleClass("toggled");
    if(wrapper.hasClass("toggled")){
      menu_toggle.css('background','rgba(0,0,0,0.5)');      
    }else{
      menu_toggle.css('background','transparent');            
    }
});

$('html').click(function(evt){    
      if($(evt.target).parents('#page-content-wrapper').length || evt.target.id === 'page-content-wrapper' || 
          $(evt.target).parents('#navbar-wrapper').length || evt.target.id === 'navbar-wrapper' 
        ){
        if(evt.target.className == 'sidebar-toggler-icon' || evt.target.id == 'menu-toggle'){
            return;
        }
        if(wrapper.hasClass("toggled")){
          wrapper.toggleClass("toggled");
          friends_list.toggleClass("toggled");
          menu_toggle.css('background','transparent');            
        }
      }
});

$('#friends-menu').on('show.bs.dropdown', function() {
  $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
});
$('#friends-menu').on('hide.bs.dropdown', function() {
  $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
});