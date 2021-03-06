//////////////////////////////////////////////////////////////////////
// 4bar/client/html/public/js/WidgetLayoutEngine.js
//
// Overview: 
//  - Provides an interface for building, submitting, and displaying
//    a layout of webpage community widgets
//
// Information on how to create your own webpage widget can be found
// in '4bar/DEVGUID.md'
//
//////////////////////////////////////////////////////////////////////

let WidgetLayoutEngine = function(widget_ui_definitions,parent,background_parent,settings){

  let __wle = this;

  __wle.rows = [];
  __wle.widgets = [];


  //////////////////////////////////////////////////////////////////////
  // Widget Layout Engine Base Initialization
  //////////////////////////////////////////////////////////////////////

  let wle_base = parent;
  wle_base.style = "min-height: 100% !important;width:100%";
  wle_base.classList.add('container');
  wle_base.style.height = "100%";

  //////////////////////////////////////////////////////////////////////
  // Available Widgets Initialization
  //////////////////////////////////////////////////////////////////////

  let wle_available_holder;
  
  if(settings && settings.template){

    let wle_available_container = document.createElement('div');
    wle_available_container.style.marginLeft = "auto";
    wle_available_container.style.marginRight = "auto";
    wle_base.appendChild(wle_available_container);

    wle_available_holder = document.createElement('div');
    wle_available_holder.style.minHeight = "100px";
    wle_available_holder.style.margin = "10px";
    wle_available_holder.style.padding = '10px';
    wle_available_container.appendChild(wle_available_holder);
  }

  //////////////////////////////////////////////////////////////////////
  // Layout Template Buttons 
  //////////////////////////////////////////////////////////////////////  

  if(settings && settings.template){
    let wle_layout_buttons_container = document.createElement('div');
    wle_layout_buttons_container.style.marginBottom = '10px';
    wle_layout_buttons_container.innerHTML = "Rows:";
    wle_layout_buttons_container.classList.add('row');
    wle_base.appendChild(wle_layout_buttons_container);

    let wle_layout_buttons_group = document.createElement('div');
    wle_layout_buttons_group.classList.add('btn-group','btn-group-lg');
    wle_layout_buttons_group.style.marginLeft = "10px";
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
    wle_layout_buttons_save.style.marginLeft = "10px";
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

  let wle_layout_container = document.createElement('div');

  wle_layout_container.style.height = "100%";
  wle_layout_container.style.minHeight = "100%";
  wle_layout_container.style.position = "relative";
  wle_layout_container.style.textAlign = "center";
  wle_base.appendChild(wle_layout_container);

  let wle_layout_background = document.createElement('div');
  wle_layout_background.style = 'min-height: 100% !important;';
  wle_layout_background.style.height = '100%';
  wle_layout_background.style.backgroundSize = 'cover';

  if(background_parent === null){
    background_parent = wle_layout_background;
  }

  if(settings && settings.background.length){
    background_parent.style.backgroundImage = 'url("/wallpapers/'+settings.background+'")';
  }else{
      if(settings && settings.defaultBackgroundImage){
        background_parent.style.backgroundImage = 'url('+settings.defaultBackgroundImage+')';
        background_parent.style.backgroundRepeat = 'repeat';
        background_parent.style.backgroundSize = 'auto';
        background_parent.style.backgroundColor = 'rgb(122,122,122)';
      }    
  }

  wle_layout_container.appendChild(wle_layout_background);

  let wle_layout_holder = document.createElement('div');
  wle_layout_holder.classList.add('wle-layout-holder');

  wle_layout_holder.style = 'transform: translate(-50%,0);';
  wle_layout_holder.style.position = 'absolute';
  wle_layout_holder.style.top = '20px';
  wle_layout_holder.style.left = '50%';
  if(typeof settings !== 'undefined' && settings.template){
    wle_layout_holder.style.width = 'calc(100% - 15px)';
  }else{
    wle_layout_holder.style.width = '100%';
  }
  
  wle_layout_container.appendChild(wle_layout_holder);

  //////////////////////////////////////////////////////////////////////
  // Dragula Initialization
  //////////////////////////////////////////////////////////////////////    
  let drake;
  if(settings && settings.template){
    drake = dragula(
      {
        copy: false
      }
    ).on('drop',function(el,container){
      // __wle.widgets.push(el);
    });

    drake.containers.push(wle_available_holder);
  }

  //////////////////////////////////////////////////////////////////////
  // Class Member Functions
  //////////////////////////////////////////////////////////////////////    

  __wle.add_column = function(row){
    let new_col = document.createElement('div');
    new_col.classList.add('wle-column');

    new_col.style.minHeight = "100px";
    new_col.style.float = "left";
    new_col.style.borderRadius = "10px";
    new_col.style.padding = "2px";
    new_col.style.marginTop = '10px';

    if(row.childNodes.length){
      new_col.style.marginLeft = '2px';      
      new_col.style.marginRight = '2px';      
    }else{
      new_col.style.marginLeft = '2px';      
      new_col.style.marginRight = '2px';      
    }

    new_col.classList.add('col-sm');

    if(settings && settings.template){
      new_col.style.border = "thin solid #ccc";
    }
    row.appendChild(new_col);

    if(settings && settings.template){
      drake.containers.push(new_col);
    }
    
    return new_col;
  }

  __wle.remove_column = function(row){
    if(row.lastChild){
      let last_col_widgets = Array.prototype.slice.call(row.lastChild.childNodes);
      for(let i = 0; i < last_col_widgets.length;i++){
        wle_available_holder.appendChild(last_col_widgets[i]);
      }
      row.removeChild(row.lastChild);          
    }
  }

   __wle.add_row = function(){
    let new_widgets_row = __wle.build_widgets_row();
    new_widgets_row.setAttribute('data-row-index',__wle.rows.length);
    new_widgets_row.classList.add('row');
    if(typeof settings !== 'undefined' && settings.template){
      new_widgets_row.style.marginLeft = '15px';
      new_widgets_row.style.marginRight = '15px';
    }

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
    new_row_button_group.style.marginBottom = '10px';
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

  socket.on('widget_delete_status',function(data) {
    if(data.status === true){
      document.querySelector('[data-widget-id="'+data.id+'"][data-widget-type="'+data.type+'"]').style.display = 'none';
    }
  });

  __wle.build_widget_container = function(type,id){

    let widget_container = document.createElement('div');
    widget_container.classList.add('wle-widget');

    if(settings && settings.template){
      let delete_btn = document.createElement('span');
      delete_btn.classList.add('close','widget-delete-btn');
      delete_btn.innerHTML = 'x';
      delete_btn.onclick = function(){
        socket.emit('widget_delete_req',{type:type,widget_id:id});
      }
      widget_container.appendChild(delete_btn);
    }

    widget_container.setAttribute('data-widget-type',type);
    widget_container.setAttribute('data-widget-id',id);    

    widget_container.style.borderRadius = "4px";
    widget_container.style.padding = "20px";
    widget_container.style.backgroundColor = "rgb(242,242,242)";
    widget_container.style.marginTop = "10px";
    widget_container.style.marginBottom = "10px";
    widget_container.style.marginLeft = "auto";
    widget_container.style.marginRight = "auto";

    return widget_container;
  }

  let active_templates = [];
  __wle.add_available_widget = function(template){
    if(template.hasOwnProperty('type') && template.hasOwnProperty('id') && template.hasOwnProperty('data')){
      let exists = false;

      for(let i in active_templates){
        if(active_templates.hasOwnProperty(i)){
          if(active_templates[i].id == template.id && active_templates[i].type == template.type){
            exists = true;
          }
        }
      }

      if(!exists){
        let widget_container = build_widget_container(template.type,template.id);
        widget_container.style.backgroundColor = '#'+template.data.bg_color;
        widget_container.style.color = '#'+template.data.text_color;
        let widget = widget_ui_definitions[template.type](template.data,widget_container);

        widget_container.appendChild(widget);
        wle_available_holder.appendChild(widget_container);     
        active_templates.push(template);     
      }
    }
  }

  __wle.build_widget = function(widget){
    let rows = [];
    let child_rows = [];
    for(let i = 0;i < wle_layout_holder.children.length;i++){
      if(wle_layout_holder.children[i].getAttribute('data-row-index')){
        child_rows.push(wle_layout_holder.children[i]);
      }
    }

    for(let y = 0; y <= widget.y;y++){
      let row = child_rows[y];
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
      widget_container.style.backgroundColor = '#'+widget.data.bg_color;
      widget_container.style.color = '#'+widget.data.text_color;
      let widget_cell = cols[widget.x];
      widget_cell.appendChild(widget_container);

      let widget_el = widget_ui_definitions[widget.type](widget.data,widget_container);
      widget_container.appendChild(widget_el);

    }
  }

  __wle.summarize_template = function(){
    let summary = [];

    let child_rows = [];
    for(let i = 0;i < wle_layout_holder.childNodes.length;i++){
      let y = wle_layout_holder.children[i].getAttribute('data-row-index');
      if(y !== null){
        let row = wle_layout_holder.children[i];
        for(let x = 0; x < row.childNodes.length;x++){
          if(row.childNodes[x].classList.contains('wle-column')){
            let column = row.childNodes[x];
            for(let z = 0; z < column.childNodes.length;z++){
              if(column.childNodes[z].classList.contains('wle-widget')){
                let widget = column.childNodes[z];
                summary.push({
                  y: y,
                  x: x,
                  z: z,
                  x_length: row.childNodes.length,
                  z_length: column.childNodes.length,
                  id: widget.getAttribute('data-widget-id'),
                  type: widget.getAttribute('data-widget-type')
                });
              }
            }
          }
        }
      }
    }

    return summary;
  }

  return this;
}
