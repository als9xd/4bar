let DropdownNotificationsDefinitions = {

	friend_requests : function(data){

		let notification_el = document.createElement('div');

		let notification_avatar = document.createElement('img');
		notification_avatar.src = data.avatar === null ? '/site/no-avatar.jpg': '/avatars/'+data.avatar;
		notification_avatar.classList.add('d-inline-block');
		notification_el.appendChild(notification_avatar)

		let notification_text = document.createElement('h6');
		notification_text.style.marginLeft = "5px";

		switch (data.type){

			// If it is a friend request
			case 'REQUEST':

			notification_text.innerHTML = 'Friend Request: '+data.username;
			notification_text.classList.add('d-inline-block');
			notification_el.appendChild(notification_text);	
			let notification_btn = document.createElement('button');
			notification_btn.style.marginLeft = "5px";
			notification_btn.style.cursor = "pointer";
			notification_btn.classList.add('btn','btn-success','btn-sm','d-inline-block');
			notification_btn.innerHTML = 'Accept';
			notification_btn.onclick = function(){
				socket.emit('friend_request_submit',{recipient_user_id:data.id});
				notification_el.style.display = 'none';
				dd_ntf_hndler.dec_dropdown_counter();
			};
			notification_el.appendChild(notification_btn);

			return notification_el;

			break;
	
			// If it is a friend request accept notification

			case 'ACCEPT':

			notification_text.innerHTML = 'Friend Request Accepted: '+data.username;
			notification_text.classList.add('d-inline-block');
			notification_el.appendChild(notification_text);				
	
			return notification_el;

			break;

			default:
			console.log(new Error("Notification type unknown: '"+data.type+"'"));
			return null;
			break;
		}

	}
}