//////////////////////////////////////////////////////////////////////
// 4bar/client/html/public/js/NotificationHandler.js
//
// Overview: 
//  - Provides defintions for the callbacks that build a widget's html
//    that will be displayed on a community's page
//
// Information on how to create your own webpage widget can be found
// in '4bar/DEVGUID.md'
//
//////////////////////////////////////////////////////////////////////

const WidgetUIDefinitions = {

  /******************************** Example ***************************************/

  /* 
  
  Key >>widget_name<< ( Must be the same as in `4bar/server/defintions/pg/pg_widget_definitions.js` )

  ==================================================================================
   
  Within this file:

  >>widget_name<< : function(data,widget_container){
    // The data argument is input data passed as the second argument of widget_submit
    // The widget_container argument is the gray box that holds the widget. You can
    // manipulate the widget container to fix modify its looks
    
    return document.createElement(div); // The html element that is returned is the widget
  },

  etc...

  */
  
  /********************************************************************************/

 youtube: function(data,widget_container){
    let widget = document.createElement('iframe');

    widget.setAttribute('width','450');
    widget.setAttribute('height','300');

    widget.setAttribute('frameborder','0');
    widget.setAttribute('allow','encrypted-media');

    widget.src = data.url;
    widget_container.style.width = "500px";
    widget_container.style.height = "350px";
    return widget; 
  },

  twitter: function(data,widget_container){
    let widget = document.createElement('a');
    widget.classList.add("twitter-follow-button");
    widget.href = data.url;
    widget_container.style.width = '0';

    $.load_script("https://platform.twitter.com/widgets.js",function(){
        twttr.events.bind(
          'loaded',
          function (event) {
            event.widgets.forEach(function (widget) {
                $(widget_container).width($(widget_container).children().eq(0).width()+20);
            });
          }
        );

    });
    return widget;
  }  
}