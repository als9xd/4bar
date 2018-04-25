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
    widget.setAttribute('data-show-count',"false");
    widget_container.style.width = "200px";
    widget.href = data.url;

    let twitter_script = document.getElementById('twitter-script');
    if(!twitter_script){
      let script = document.createElement('script');
      script.src = "https://platform.twitter.com/widgets.js";
      script.charset = 'utf-8';
      document.head.appendChild(script);
    }

    return widget;
  },

  tournaments: function(data,widget_container){
    let widget = document.createElement('div');

    let table_title = document.createElement('h3');
    table_title.innerHTML = 'Tournaments';
    widget.appendChild(table_title);
    widget.appendChild(document.createElement('hr'));

    let table = document.createElement('table');
    table.style.borderSpacing = '10px';
    table.style.width = '100%';
    table.style.textAlign = 'left';

    for(let t in data.tournaments){
      if(data.tournaments.hasOwnProperty(t)){
        let tr_name = document.createElement('tr');

        let tournament_link = document.createElement('a');
        tournament_link.href = '/tournaments?id='+data.tournaments[t].id;
        tournament_link.innerHTML = '<h3>'+data.tournaments[t].name+'</h3>';
        tr_name.appendChild(tournament_link);

        table.appendChild(tr_name);

        let tr_description = document.createElement('tr');
        tr_description.innerHTML = data.tournaments[t].description.length > 1 ? data.tournaments[t].description : 'No description available';

        table.appendChild(tr_description);

      }
    }

    widget.appendChild(table);

    widget_container.classList.add('col-sm')
    return widget;
  },

  markdown: function(data,widget_container){
    let widget = document.createElement('div');
    widget.style.textAlign = 'left';

    widget.innerHTML = converter.makeHtml(data.markdown);

    widget_container.classList.add('col-sm')
    return widget;   
  }

}