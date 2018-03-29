let FriendsHandler = function (socket) {
	let friends_menu = document.getElementById('friends-dropdown-menu');
	socket.emit('friends_req');
	socket.on('friends_res',function(friends){
		for(let i = 0; i < friends.length;i++){
			let friends_row = document.createElement('div');
			friends_row.style.cursor = 'pointer';
			friends_row.onclick = function(){
				window.location.replace('/profile?id='+friends[i].id);
			}
			friends_row.classList.add('dropdown-item');

			let friends_row_avatar = document.createElement('img');
			friends_row_avatar.style.display = 'inline-block';
			if(friends[i].avatar !== null){
				friends_row_avatar.src = friends[i].avatar;
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
}