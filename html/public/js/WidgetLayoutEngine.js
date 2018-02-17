let WidgetLayoutEngine = function(widget_ui_definitions,parent,settings){

  let __wle = this;

  __wle.rows = [];
  __wle.widgets = [];

  __wle.build_header = function(text){
    let header = document.createElement('h1');
    header.style.textAlign = "center";
    header.style.borderBottom = "2px solid black";
    header.innerHTML = text;
    return header;  
  }  


  //////////////////////////////////////////////////////////////////////
  // Widget Layout Engine Base Initialization
  //////////////////////////////////////////////////////////////////////

  let wle_base = parent;
  wle_base.style = "min-height: 100% !important";
  wle_base.style.height = "100%";
  // wle_base.style.marginTop = "20px";

  //////////////////////////////////////////////////////////////////////
  // Available Widgets Initialization
  //////////////////////////////////////////////////////////////////////

  let wle_available_holder;
  
  if(settings && settings.template){
    let wle_available_header = __wle.build_header('Available Widgets');
    wle_base.appendChild(wle_available_header);

    let wle_available_container = document.createElement('div');
    wle_available_container.style.marginLeft = "auto";
    wle_available_container.style.marginRight = "auto";
    wle_base.appendChild(wle_available_container);

    wle_available_holder = document.createElement('div');
    wle_available_container.appendChild(wle_available_holder);
  }

  //////////////////////////////////////////////////////////////////////
  // Layout Template Buttons 
  //////////////////////////////////////////////////////////////////////  

  if(settings && settings.template){
    let wle_layout_buttons_container = document.createElement('div');
    wle_layout_buttons_container.classList.add('container');
    wle_layout_buttons_container.innerHTML = "Rows:";
    wle_base.appendChild(wle_layout_buttons_container);

    let wle_layout_buttons_group = document.createElement('div');
    wle_layout_buttons_group.classList.add('btn-group','btn-group-lg');
    wle_layout_buttons_container.appendChild(wle_layout_buttons_group);

    let wle_layout_buttons_add_row = document.createElement('button');
    wle_layout_buttons_add_row.classList.add('btn','btn-primary','btn-lg');
    wle_layout_buttons_add_row.innerHTML = '+';
    wle_layout_buttons_add_row.onclick = function(){__wle.add_row()};
    wle_layout_buttons_group.appendChild(wle_layout_buttons_add_row); 

    let wle_layout_buttons_remove_row = document.createElement('button');
    wle_layout_buttons_remove_row.classList.add('btn','btn-primary','btn-lg');
    wle_layout_buttons_remove_row.innerHTML = '-';
    wle_layout_buttons_remove_row.onclick = function(){__wle.remove_row()};
    wle_layout_buttons_group.appendChild(wle_layout_buttons_remove_row); 

    let wle_layout_buttons_save = document.createElement('button');
    wle_layout_buttons_save.classList.add('btn','btn-primary','btn-lg');
    wle_layout_buttons_save.innerHTML = 'Save';

    if(settings && settings.template && settings.save_callback){
      wle_layout_buttons_save.onclick = function(){
        settings.save_callback();    
      }
    }

    wle_layout_buttons_container.appendChild(wle_layout_buttons_save); 
  }
  //////////////////////////////////////////////////////////////////////
  // Layout Template Initialization
  //////////////////////////////////////////////////////////////////////  

  if(settings && settings.template){
    let wle_layout_header = __wle.build_header('Widgets Layout');
    wle_base.appendChild(wle_layout_header);
  }

  let wle_layout_container = document.createElement('div');
  wle_layout_container.style.height = "100%";
  wle_layout_container.style.minHeight = "100%";
  wle_layout_container.style.position = "relative";
  wle_layout_container.style.textAlign = "center";
  wle_base.appendChild(wle_layout_container);

  let wle_layout_background = document.createElement('div');
  wle_layout_background.style = 'min-height: 100% !important;';
  wle_layout_background.style.height = '100%';
  wle_layout_background.style.backgroundColor = 'rgb(122,122,122)';

  if(settings && settings.background && settings.background.length){
    let background_img = new Image();
    background_img.onload = function(){
      wle_layout_background.style.backgroundImage = 'url('+settings.background+')';
    }
    background_img.onerror = function(){
      wle_layout_background.style.backgroundImage = 'url("https://www.transparenttextures.com/patterns/3px-tile.png")';
    }
    background_img.src = settings.background;
  }

  wle_layout_container.appendChild(wle_layout_background);

  let wle_layout_holder = document.createElement('div');
  wle_layout_holder.style = 'transform: translate(-50%,0);';
  wle_layout_holder.style.position = 'absolute';
  wle_layout_holder.style.top = '20px';
  wle_layout_holder.style.left = '50%';
  wle_layout_holder.style.width = '100%';
  wle_layout_container.appendChild(wle_layout_holder);

  //////////////////////////////////////////////////////////////////////
  // Dragula Initialization
  //////////////////////////////////////////////////////////////////////    

  if(settings && settings.template){
    var drake = dragula(
      {
        copy: true
      }
    ).on('drop',function(el,container){
      __wle.widgets.push(el);
    });

    drake.containers.push(wle_available_holder);
  }

  //////////////////////////////////////////////////////////////////////
  // Functions
  //////////////////////////////////////////////////////////////////////    


  __wle.add_column = function(row){
    var new_col = document.createElement('div');

    new_col.style.minHeight = "100px";
    new_col.style.float = "left";
    new_col.style.borderRadius = "10px";
    new_col.style.padding = "10px";
    new_col.style.marginRight = "10px";

    if(settings && settings.template){
      new_col.style.border = "thin solid #ccc";
    }
    row.appendChild(new_col);
    for(let i = 0; i < row.childNodes.length;i++){
      row.childNodes[i].style.width = "calc("+(Math.floor(100/row.childNodes.length))+"% - 10px)";
    }
    if(settings && settings.template){
      drake.containers.push(new_col);
    }
    
    return new_col;
  }

  __wle.remove_column = function(row){
    if(row.lastChild){
      let last_col_widgets = Array.prototype.slice.call(row.lastChild.childNodes);
      for(var i = 0; i < last_col_widgets.length;i++){
        wle_available_holder.appendChild(last_col_widgets[i]);
      }
      row.removeChild(row.lastChild);
      for(var i = 0; i < row.childNodes.length;i++){
        row.childNodes[i].style.width = "calc("+(Math.floor(100/row.childNodes.length))+"% - 10px)";
      }           
    }
  }

   __wle.add_row = function(){
    let new_widgets_row = __wle.build_widgets_row();
    new_widgets_row.setAttribute('data-row-index',__wle.rows.length);
    new_widgets_row.style.marginLeft = "10px";

    if(settings && settings.template){
      let new_buttons_row = __wle.build_buttons_row(new_widgets_row);
      wle_layout_holder.appendChild(new_buttons_row);
    }
    
    wle_layout_holder.appendChild(new_widgets_row);
    __wle.rows.push(new_widgets_row);

    return new_widgets_row;
  };

  __wle.remove_row = function(){
    let last_row = wle_layout_holder.lastChild;
    if(last_row){
      let columns = last_row.childNodes;
      for(let i = columns.length -1 ; i >= 0;i--){
        remove_column(last_row);
        __wle.rows.pop();
      }
      wle_layout_holder.removeChild(last_row);
      let last_buttons_row = wle_layout_holder.lastChild;
      if(last_buttons_row){
        wle_layout_holder.removeChild(last_buttons_row);
      }
    }
  }

  __wle.build_buttons_row = function(row){

    let new_row_button_group = document.createElement('div');
    new_row_button_group.classList.add('container');
    new_row_button_group.style.width = "100%";
    new_row_button_group.classList.add('btn-group','btn-group-large');
    new_row_button_group.style.marginTop = "10px";

    let new_row_add_button = document.createElement('button');
    new_row_add_button.classList.add('btn','btn-primary');
    new_row_add_button.onclick = function(){add_column(row)};
    new_row_add_button.setAttribute('type','button');
    new_row_add_button.innerHTML = '+';
    new_row_button_group.appendChild(new_row_add_button);

    let new_row_remove_button = document.createElement('button');
    new_row_remove_button.classList.add('btn','btn-primary');
    new_row_remove_button.onclick = function(){remove_column(row)};
    new_row_remove_button.setAttribute('type','button');
    new_row_remove_button.innerHTML = '-';
    new_row_button_group.appendChild(new_row_remove_button);

    return new_row_button_group;
  }


  __wle.build_widgets_row = function(){
    let new_row = document.createElement('div');
    new_row.style.marginTop = "10px";
    return new_row;
  }


  __wle.build_widget_container = function(type,id){
    let widget_container = document.createElement('div');

    widget_container.setAttribute('data-widget-type',type);
    widget_container.setAttribute('data-widget-id',id);    

    widget_container.style.border = "thin solid #ccc";
    widget_container.style.borderRadius = "4px";
    widget_container.style.padding = "20px";
    widget_container.style.backgroundColor = "rgb(242,242,242)";
    widget_container.style.marginTop = "10px";
    widget_container.style.marginBottom = "10px";
    widget_container.style.marginLeft = "auto";
    widget_container.style.marginRight = "auto";

    return widget_container;
  }

  __wle.add_available_widget = function(template){
    if(template.hasOwnProperty('type') && template.hasOwnProperty('id') && template.hasOwnProperty('data')){
      let exists = false;
      for(let i in wle_available_holder.children){
       if(wle_available_holder.children.hasOwnProperty(i)){
         if(
            wle_available_holder.children[i].getAttribute('data-widget-type') == template.type &&
            wle_available_holder.children[i].getAttribute('data-widget-id') == template.id
            ){
              exists = true;
              break;       
          }

        }
      }
      if(!exists){
        let widget_container = build_widget_container(template.type,template.id);

        let widget = widget_ui_definitions[template.type](template.data,widget_container);

        widget_container.appendChild(widget);
        wle_available_holder.appendChild(widget_container);          
      }
    }
  }

  __wle.build_widget = function(widget){
    let rows = [];
    for(let y = 0; y <= widget.y;y++){
      let row = wle_layout_holder.children[y];
      if(row && row.getAttribute('data-row-index')){
        rows.push(row);
      }else{
        rows.push(__wle.add_row(wle_layout_holder));
      }
    }

    let cols = [];
    for(let x = 0; x < widget.x_length;x++){
      if(rows[widget.y].children[x]){
        cols.push(rows[widget.y].children[x]);
      }else{
        cols.push(__wle.add_column(rows[widget.y]));
      }
    }

    if(widget_ui_definitions[widget.type]){

      let widget_container = __wle.build_widget_container(widget.type,widget.id);
      let widget_cell = cols[widget.x];

      widget_cell.appendChild(widget_container);

      let widget_el = widget_ui_definitions[widget.type](widget.data,widget_container);
      widget_container.appendChild(widget_el);

    }
  }

  __wle.summarize_template = function(){
    let summary = [];
    let unique_widgets = __wle.widgets.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
    for(let i = 0; i < unique_widgets.length;i++){
      let widget_el = unique_widgets[i];
      let container = widget_el.parentNode;
      let row_index;
      for(let y in __wle.rows){
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
