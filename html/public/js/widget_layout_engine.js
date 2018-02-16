function image_exists(url, callback) {
  var img = new Image();
  img.onload = function() { callback(true); };
  img.onerror = function() { callback(false); };
  img.src = url;
}

let widgets_layout_engine = function(widget_ui_definitions,settings){
  let __widgets_layout_engine = this;

  let available_widgets_holder = document.getElementById('available-widgets-holder');
  let widget_layouts_holder = document.getElementById('widget-layouts-holder');
  let widgets_layout_background = document.getElementById("widgets-layout-background");
  if(settings && settings.background && settings.background.length){
    image_exists(settings.background,function(exists){
      widgets_layout_background.style.backgroundImage = 'url('+settings.background+')';
    });
  }

  __widgets_layout_engine.container_matrix = [];
  __widgets_layout_engine.num_rows = 0;

  __widgets_layout_engine.widgets = [];

  var drake = dragula(
    {
      copy: true
    }
  ).on('drop',function(el,container){
    __widgets_layout_engine.widgets.push(el);
  });

  drake.containers.push(available_widgets_holder);

  __widgets_layout_engine.add_column = function(row){
    var new_col = document.createElement('div');
    if(settings && settings.template){
      new_col.style.border = "thin solid #ccc";
    }
    row.appendChild(new_col);
    for(let i = 0; i < row.childNodes.length;i++){
      row.childNodes[i].classList.add('widget-column')
      row.childNodes[i].style.width = "calc("+(Math.floor(100/row.childNodes.length))+"% - 10px)";
    }
    if(settings && settings.template){
      drake.containers.push(new_col);
    }
    
    return new_col;
  }

  __widgets_layout_engine.remove_column = function(row){
    if(row.lastChild){
      let last_col_widgets = Array.prototype.slice.call(row.lastChild.childNodes);
      for(var i = 0; i < last_col_widgets.length;i++){
        available_widgets_holder.appendChild(last_col_widgets[i]);
      }
      row.removeChild(row.lastChild);
      for(var i = 0; i < row.childNodes.length;i++){
        row.childNodes[i].style.width = "calc("+(Math.floor(100/row.childNodes.length))+"% - 10px)";
      }           
    }
  }

  __widgets_layout_engine.build_buttons_row = function(parent){

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

  __widgets_layout_engine.build_widgets_row = function(){
    let new_row = document.createElement('div');
    new_row.classList.add('row','widgets-row');
    return new_row;
  }

   __widgets_layout_engine.add_layout_row = function(parent){
    let new_widgets_row = __widgets_layout_engine.build_widgets_row();
    new_widgets_row.setAttribute('data-row-index',__widgets_layout_engine.num_rows)
    let new_buttons_row = __widgets_layout_engine.build_buttons_row(new_widgets_row);
    parent.appendChild(new_buttons_row);
    parent.appendChild(new_widgets_row);
    return new_widgets_row;
  };

   __widgets_layout_engine.add_template_row = function(parent){
    let new_widgets_row = __widgets_layout_engine.build_widgets_row();
    new_widgets_row.setAttribute('data-row-index',__widgets_layout_engine.num_rows)
    parent.appendChild(new_widgets_row);
    return new_widgets_row;
  };

  __widgets_layout_engine.remove_template_row = function(parent){
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


  __widgets_layout_engine.add_available_widget = function(template,parent){
    if(template.hasOwnProperty('type') && template.hasOwnProperty('id') && template.hasOwnProperty('data')){

      let exists = false;
      for(let i in parent.children){
        if(parent.children.hasOwnProperty(i)){
          if(
            parent.children[i].getAttribute('data-widget-type') == template.type &&
            parent.children[i].getAttribute('data-widget-id') == template.id
            ){
              exists = true;
              break;       
          }

        }
      }
      if(!exists){
       let widget_container = document.createElement('div');
        let widget = widget_ui_definitions[template.type](template.data,widget_container);
        widget.classList.add('widget');
        widget_container.setAttribute('data-widget-type',template.type);
        widget_container.setAttribute('data-widget-id',template.id);

        widget_container.classList.add('widget-container');

        widget_container.appendChild(widget);
        available_widgets_holder.appendChild(widget_container);          
      }
    }
  }

  __widgets_layout_engine.build_widget_container = function(){
    let widget_container = document.createElement('div');
    widget_container.classList.add('widget-container');
    return(widget_container);
  }

  __widgets_layout_engine.build_widget = function(widget,parent,settings){
    let rows = [];
    for(let y = 0; y <= widget.y;y++){
      let row = parent.children[y];
      if(row && row.getAttribute('data-row-index')){
        rows.push(row);
      }else{
        rows.push(__widgets_layout_engine.add_template_row(parent));
      }
    }

    let cols = [];
    for(let x = 0; x < widget.x_length;x++){
      if(rows[widget.y].children[x]){
        cols.push(rows[widget.y].children[x]);
      }else{
        cols.push(__widgets_layout_engine.add_column(rows[widget.y]));
      }
    }

    let widget_container = __widgets_layout_engine.build_widget_container();

    let widget_cell = cols[widget.x];
    widget_cell.appendChild(widget_container);
    if(widget_ui_definitions[widget.type]){
      let widget_el = widget_ui_definitions[widget.type](widget.data,widget_container);
      widget_container.setAttribute('data-widget-type',widget.type);
      widget_container.setAttribute('data-widget-id',widget.id);
      widget_container.appendChild(widget_el);
    }
  }

  __widgets_layout_engine.summarize_template = function(){
    let summary = [];
    let unique_widgets = __widgets_layout_engine.widgets.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
    for(let i = 0; i < unique_widgets.length;i++){
      let widget_el = unique_widgets[i];
      let container = widget_el.parentNode;
      let row_index;
      let rows = document.getElementsByClassName('widgets-row');
      for(let y in rows){
        if(container.parentNode == rows[y]){
          row_index = y;
        }
      }
      let widget = {
        y: Number(row_index),
        x: Number([].indexOf.call(container.parentNode.children, container)),
        z: Number([].indexOf.call(container.children, widget_el)),
        x_length: Number(container.parentNode.children.length),
        z_length: Number(container.children.length),
        id: Number(widget_el.getAttribute('data-widget-id')),
        type: widget_el.getAttribute('data-widget-type')
      }
      summary.push(widget);
    }
    return summary;
  }

  return this;
}
