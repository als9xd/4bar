let app_layouts_engine = function(){
  let available_apps_holder = document.getElementById('available-apps-holder');
  let app_rows_holder = document.getElementById('app-layouts-holder');

  var drake = dragula();
  drake.containers.push(available_apps_holder);

  this.add_column = function(row){
    var new_col = document.createElement('div');
    row.appendChild(new_col);
    for(let i = 0; i < row.childNodes.length;i++){
      row.childNodes[i].classList.add('app-column')
      row.childNodes[i].style.width = "calc("+(Math.floor(100/row.childNodes.length))+"% - 10px)";
    }
    drake.containers.push(new_col);
  }
  
  this.remove_column = function(row){
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

  this.add_row = function(){
    let new_row = document.createElement('div');
    new_row.classList.add('row','apps-row');

    let new_row_button_group = document.createElement('div');
    new_row_button_group.classList.add('btn-group','btn-group-large');
    app_rows_holder.appendChild(new_row_button_group);

    let new_row_add_button = document.createElement('button');
    new_row_add_button.classList.add('btn','btn-primary');
    new_row_add_button.onclick = function(){add_column(new_row)};
    new_row_add_button.setAttribute('type','button');
    new_row_add_button.innerHTML = '+';
    new_row_button_group.appendChild(new_row_add_button);

    let new_row_remove_button = document.createElement('button');
    new_row_remove_button.classList.add('btn','btn-primary');
    new_row_remove_button.onclick = function(){remove_column(new_row)};
    new_row_remove_button.setAttribute('type','button');
    new_row_remove_button.innerHTML = '-';
    new_row_button_group.appendChild(new_row_remove_button);

    app_rows_holder.appendChild(new_row);
    $('html, body').scrollTop( $(document).height());
  }

  this.remove_row = function(){
    let last_row = app_rows_holder.lastChild;
    if(last_row){
      let columns = last_row.childNodes;
      for(let i = columns.length -1 ; i >= 0;i--){
        remove_column(last_row);
      }
      app_rows_holder.removeChild(last_row);
      let last_buttons_row = app_rows_holder.lastChild;
      if(last_buttons_row){
        app_rows_holder.removeChild(last_buttons_row);
      }
    }
  }
  return this;
}
