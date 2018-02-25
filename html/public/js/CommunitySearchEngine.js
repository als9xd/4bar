let CommunitySearchEngine = function(socket,parent){
      $(parent).keyup(function(event){
        if(event.keyCode == 13){
          $('#c_search_submit').click();
        }
      });

	const c_search_input = document.createElement('input');
	c_search_input.classList.add('form-control','mr-sm-2');
	c_search_input.type = 'text';
	c_search_input.placeholder = 'Search';
	c_search_input.autocomplete = 'off';
	parent.appendChild(c_search_input);

	const c_search_list = document.createElement('table');
	c_search_list.style.backgroundColor = 'white';
	c_search_list.style.position = 'absolute';
	c_search_list.style.width = '223px';
	c_search_list.style.border = 'thin solid #ccc';
	c_search_list.style.tableLayout = 'fixed';
	c_search_list.style.display = 'none';
	parent.appendChild(c_search_list);

	socket.on('search_communities_res',function(coms){
		while (c_search_list.firstChild) {
		    c_search_list.removeChild(c_search_list.firstChild);
		}
		c_search_list.style.display = 'none';
		for(let com in coms){
		  if(coms.hasOwnProperty(com)){
		    c_search_list.style.display = 'table';
		    let new_row = document.createElement('tr');
		    new_row.style.cursor = "pointer";
		    new_row.addEventListener('click', function() {
		        var href = coms[com].url;
		        if (href) {
		            window.location.assign(href);
		        }
		    });

		    $(new_row).hover(function(){
		      $(this).css("background-color", "#f7f7f7");
		      }, function(){
		      $(this).css("background-color", "white");              
		    });

		    let new_icon_col = document.createElement('td');      
		    new_icon_col.style.height = "25px";
		    new_icon_col.style.width = "25px";
		    let new_icon = document.createElement('img');
		    if(coms[com].icon){
		      new_icon.src = coms[com].icon;
		    }
		    new_icon.style.height = "25px";
		    new_icon.style.width = "25px";
		    new_icon.style.left = "0";
		    new_icon_col.appendChild(new_icon);
		    new_row.appendChild(new_icon_col);

		    let new_link_col = document.createElement('td');
		    let new_row_link = document.createElement('a');
		    new_row_link.style.width = "197px";
		    new_row_link.style.marginLeft = "3px";
		    new_row_link.innerHTML = coms[com].name;
		    new_link_col.appendChild(new_row_link);
		    new_row.appendChild(new_link_col);

		    c_search_list.appendChild(new_row);
		  }
		}
	});

	this.search = function(){
		socket.emit('search_communities_req',{query:c_search_input.value});
    }

    return this;
}