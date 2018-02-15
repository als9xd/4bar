const web_apps = {
   youtube: function(data,app_container){
      

      let iframe = document.createElement('iframe');

      iframe.setAttribute('width','450');
      iframe.setAttribute('height','300');

      iframe.setAttribute('frameborder','0');
      iframe.setAttribute('allow','encrypted-media');

      iframe.src = data.url;
      app_container.style.width = "500px";
      app_container.style.height = "350px";
      return iframe; 
    },

    twitter: function(data,app_container){
      let app = document.createElement('a');
      app.classList.add("twitter-follow-button");
      app.href = data.url;
      app.innerHTML = "Tweets by TwitterDev";
      $.load_script("https://platform.twitter.com/widgets.js",function(){
        $(app_container).width($(app).width()+60);
      });
      return app;
    }
}

let apps_layout_engine = function(settings){
  let __apps_layout_engine = this;

  let available_apps_holder = document.getElementById('available-apps-holder');
  let app_layouts_holder = document.getElementById('app-layouts-holder');

  __apps_layout_engine.container_matrix = [];
  __apps_layout_engine.num_rows = 0;

  __apps_layout_engine.apps = [];

  var drake = dragula().on('drop',function(el,container){
    __apps_layout_engine.apps.push(el);
  });

  drake.containers.push(available_apps_holder);

  __apps_layout_engine.add_column = function(row){
    var new_col = document.createElement('div');
    if(settings && settings.template){
      new_col.style.border = "thin solid #ccc";
    }
    row.appendChild(new_col);
    for(let i = 0; i < row.childNodes.length;i++){
      row.childNodes[i].classList.add('app-column')
      row.childNodes[i].style.width = "calc("+(Math.floor(100/row.childNodes.length))+"% - 10px)";
    }
    drake.containers.push(new_col);
    return new_col;
  }

  __apps_layout_engine.remove_column = function(row){
    if(row.lastChild){
      let last_col_apps = Array.prototype.slice.call(row.lastChild.childNodes);
      for(var i = 0; i < last_col_apps.length;i++){
        available_apps_holder.appendChild(last_col_apps[i]);
      }
      row.removeChild(row.lastChild);
      for(var i = 0; i < row.childNodes.length;i++){
        row.childNodes[i].style.width = "calc("+(Math.floor(100/row.childNodes.length))+"% - 10px)";
      }           
    }
  }

  __apps_layout_engine.build_buttons_row = function(parent){

    let new_row_button_group = document.createElement('div');
    new_row_button_group.classList.add('btn-group','btn-group-large');

    let new_row_add_button = document.createElement('button');
    new_row_add_button.classList.add('btn','btn-primary');
    new_row_add_button.onclick = function(){add_column(parent)};
    new_row_add_button.setAttribute('type','button');
    new_row_add_button.innerHTML = '+';
    new_row_button_group.appendChild(new_row_add_button);

    let new_row_remove_button = document.createElement('button');
    new_row_remove_button.classList.add('btn','btn-primary');
    new_row_remove_button.onclick = function(){remove_column(parent)};
    new_row_remove_button.setAttribute('type','button');
    new_row_remove_button.innerHTML = '-';
    new_row_button_group.appendChild(new_row_remove_button);


    return new_row_button_group;
  }

  __apps_layout_engine.build_apps_row = function(){
    let new_row = document.createElement('div');
    new_row.classList.add('row','apps-row');
    return new_row;
  }

   __apps_layout_engine.add_layout_row = function(parent){
    let new_apps_row = __apps_layout_engine.build_apps_row();
    new_apps_row.setAttribute('data-row-index',__apps_layout_engine.num_rows)
    let new_buttons_row = __apps_layout_engine.build_buttons_row(new_apps_row);
    parent.appendChild(new_buttons_row);
    parent.appendChild(new_apps_row);
    return new_apps_row;
  };

   __apps_layout_engine.add_template_row = function(parent){
    let new_apps_row = __apps_layout_engine.build_apps_row();
    new_apps_row.setAttribute('data-row-index',__apps_layout_engine.num_rows)
    parent.appendChild(new_apps_row);
    return new_apps_row;
  };

  __apps_layout_engine.remove_template_row = function(parent){
    let last_row = parent.lastChild;
    if(last_row){
      let columns = last_row.childNodes;
      for(let i = columns.length -1 ; i >= 0;i--){
        remove_column(last_row);
      }
      parent.removeChild(last_row);
      let last_buttons_row = parent.lastChild;
      if(last_buttons_row){
        parent.removeChild(last_buttons_row);
      }
    }
  }


  __apps_layout_engine.add_available_app = function(template,parent){
    if(template.hasOwnProperty('type') && template.hasOwnProperty('id') && template.hasOwnProperty('data')){

      let exists = false;
      for(let i in parent.children){
        if(parent.children.hasOwnProperty(i)){
          if(
            parent.children[i].getAttribute('data-app-type') == template.type &&
            parent.children[i].getAttribute('data-app-id') == template.id
            ){
              exists = true;
              break;       
          }

        }
      }
      if(!exists){
       let app_container = document.createElement('div');
        let app = web_apps[template.type](template.data,app_container);
        app.classList.add('app');
        app_container.setAttribute('data-app-type',template.type);
        app_container.setAttribute('data-app-id',template.id);

        app_container.classList.add('app-container');

        app_container.appendChild(app);
        available_apps_holder.appendChild(app_container);          
      }
    }
  }

  __apps_layout_engine.build_app_container = function(){
    let app_container = document.createElement('div');
    app_container.classList.add('app-container');
    return(app_container);
  }

  __apps_layout_engine.build_app = function(app,parent,settings){
    let rows = [];
    for(let y = 0; y <= app.y;y++){
      let row = parent.children[y];
      if(row && row.getAttribute('data-row-index')){
        rows.push(row);
      }else{
        rows.push(__apps_layout_engine.add_template_row(parent));
      }
    }

    let cols = [];
    for(let x = 0; x < app.x_length;x++){
      if(rows[app.y].children[x]){
        cols.push(rows[app.y].children[x]);
      }else{
        cols.push(__apps_layout_engine.add_column(rows[app.y]));
      }
    }

    let app_container = __apps_layout_engine.build_app_container();

    let app_cell = cols[app.x];
    app_cell.appendChild(app_container);
    if(web_apps[app.type]){
      let app_el = web_apps[app.type](app.data,app_container);
      app_container.setAttribute('data-app-type',app.type);
      app_container.setAttribute('data-app-id',app.id);
      app_container.appendChild(app_el);
    }
  }

  __apps_layout_engine.summarize_template = function(){
    let summary = [];
    let unique_apps = __apps_layout_engine.apps.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
    for(let i = 0; i < unique_apps.length;i++){
      let app_el = unique_apps[i];
      let container = app_el.parentNode;
      let row_index;
      let rows = document.getElementsByClassName('apps-row');
      for(let y in rows){
        if(container.parentNode == rows[y]){
          row_index = y;
        }
      }
      let app = {
        y: Number(row_index),
        x: Number([].indexOf.call(container.parentNode.children, container)),
        z: Number([].indexOf.call(container.children, app_el)),
        x_length: Number(container.parentNode.children.length),
        z_length: Number(container.children.length),
        id: Number(app_el.getAttribute('data-app-id')),
        type: app_el.getAttribute('data-app-type')
      }
      summary.push(app);
    }
    return summary;
  }

  return this;
}
