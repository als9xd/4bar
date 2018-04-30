let FriendsListHandler = function (socket) {
	let friends_menu = document.getElementById('friends-menu');
	socket.emit('friends_req');
	setInterval(function(){
		socket.emit('friends_req');
	},
	1000*3 // Update every 3 seconds
	);
	
	socket.on('friends_res',function(friends){

		while(friends_menu.firstChild){
			friends_menu.removeChild(friends_menu.firstChild);
		}

		for(let i = 0; i < friends.length;i++){
			let friends_row = document.createElement('div');
			friends_row.style.cursor = 'pointer';
			friends_row.onclick = function(){
				window.location.replace('/profile?id='+friends[i].id);
			}
			friends_row.classList.add('dropdown-item');

			let friends_row_avatar = document.createElement('img');
			friends_row_avatar.style.display = 'inline-block';
			friends_row_avatar.style.marginBottom='3px';
			if(friends[i].avatar !== null){
				friends_row_avatar.src = '/avatars/'+friends[i].avatar;
			}else{
				friends_row_avatar.src = '/site/no-avatar.jpg';
			}
			friends_row.appendChild(friends_row_avatar);

			let friends_row_username = document.createElement('div');
			friends_row_username.style.display = 'inline-block';
			friends_row_username.style.marginLeft = '5px';
			friends_row_username.innerHTML = friends[i].username;
			friends_row.appendChild(friends_row_username);

			friends_menu.appendChild(friends_row);
		}
	});

    let friend_request_btn = document.getElementById('friend-request-btn');

	socket.on('friend_request_status',function(data){
		if(data.status === true){
		  switch (data.type){
		    case 'ACCEPT':
		      if(friend_request_btn){
		        friend_request_btn.style.display = 'none';
		      }
		      socket.emit('friends_req');
		    break;

		    case 'REQUEST':
		      if(friend_request_btn){
		        friend_request_btn.style.display = 'none';
		      }
		      socket.emit('friends_req');
		    break;

		    default:
		      if(typeof data.type !== 'undefined'){
		        console.log(new Error("Unkown friend request type '"+data.type+"'"));
		      }else{
		        console.log(new Error("Friend request type is required"));              
		      }
		  }
		}
	});  

	return this;
}