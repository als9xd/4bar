let wrapper =  $("#wrapper");
let menu_toggle = $("#menu-toggle");
$(menu_toggle).click(function(e) {
    e.preventDefault();
    wrapper.toggleClass("toggled");
    if(wrapper.hasClass("toggled")){
      menu_toggle.css('background','rgba(0,0,0,0.5)');      
    }else{
      menu_toggle.css('background','transparent');            
    }
});

$('html').click(function(evt){    

     if($(evt.target).closest('#menu-toggle').length)
        return;       
     if($(evt.target).closest('#sidebar-wrapper').length)
        return;   

      if(wrapper.hasClass("toggled")){
        wrapper.toggleClass("toggled");
        menu_toggle.css('background','transparent');            
      }
});

