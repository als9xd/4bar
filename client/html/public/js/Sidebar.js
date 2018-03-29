let wrapper =  $("#wrapper");
let friends_list= $('#friends-list')
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

let ignore_divs = [
  '#menu-toggle',
  '#sidebar-wrapper',
  '#friends-list',
  '#friends-dropdown-menu'
]

$('html').click(function(evt){    

      for(let i = 0; i < ignore_divs.length;i++){
       if($(evt.target).closest(ignore_divs[i]).length)
          return;   
      }
      if(wrapper.hasClass("toggled")){
        wrapper.toggleClass("toggled");
        friends_list.toggleClass("toggled");
        menu_toggle.css('background','transparent');            
      }
});

$('#friends-dropup').on('show.bs.dropdown', function() {
  $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
});
$('#friends-dropup').on('hide.bs.dropdown', function() {
  $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
});