let dd_notification_definitions = {
	friend_requests : function(data){
		let notification_el = document.createElement('div');

		let notification_avatar = document.createElement('img');
		notification_avatar.src = data.avatar === null ? '/site/no-avatar.jpg': '/avatars/'+data.avatar;
		notification_avatar.classList.add('d-inline-block');
		notification_el.appendChild(notification_avatar)

		let notification_text = document.createElement('h6');
		notification_text.style.marginLeft = "5px";
		notification_text.innerHTML = 'Friend Request: '+data.username;
		notification_text.classList.add('d-inline-block');
		notification_el.appendChild(notification_text);		

		let notification_btn = document.createElement('button');
		notification_btn.style.marginLeft = "5px";
		notification_btn.style.cursor = "pointer";
		notification_btn.classList.add('btn','btn-success','btn-sm','d-inline-block');
		notification_btn.innerHTML = 'Accept';
		notification_btn.onclick = function(){socket.emit('friend_request_submit',{recipient_user_id:data.id})};
		notification_el.appendChild(notification_btn);		

		return notification_el;
	}
}

let DropdownNotificationsHandler = function(socket) {
	socket.emit('dropdown_notifications_req');
	let dropdown_menu = document.getElementById('notification-dropdown-menu');
	let dropdown_count = document.createElement('span');
	dropdown_count.id = "notifications-count";
	dropdown_count.innerHTML = 0;
	dropdown_count.style.display = 'none';
	document.getElementById('notification-dropdown').appendChild(dropdown_count);
	socket.on('dropdown_notifications_res',function(notifications){
		let new_dropdown_count = 0;
		for(let type in notifications){
			if(notifications.hasOwnProperty(type)){
				for(let i = 0; i < notifications[type].length;i++){
					new_dropdown_count++;
					let notification_el = dd_notification_definitions[type](notifications[type][i]);

					let old_date = new Date(notifications[type][i].date);

					let msMinute = 60*1000;
					let msHour = 60*60*1000;
		    		let msDay = 60*60*24*1000;

					let notification_date = document.createElement('div');
					let set_time =function(){
			
						let new_date = new Date;

			    		let elapsed_min = Math.floor(((new_date - old_date) % msDay) / msMinute);
			    		let elapsed_hours = Math.floor(((new_date - old_date) % msDay) / msHour);
			    		let elapsed_days = Math.floor((new_date - old_date) / msDay);

						if(elapsed_min === 0){
							notification_date.innerHTML = 'Received just now';				
						}else if(elapsed_hours === 0){
							notification_date.innerHTML = 'Received '+elapsed_min+' minute'+(elapsed_min > 1 ? 's':'')+' ago';
						}
						else if(elapsed_days === 0){
							notification_date.innerHTML = 'Received '+elapsed_hours+' hour'+(elapsed_hours > 1 ? 's':'')+' ago';
						}else{
							notification_date.innerHTML = 'Received '+elapsed_min+' days'+(elapsed_min > 1 ? 's':'')+' ago';				
						}

		    		};
		    		set_time();
					setTimeout(set_time,
		    		//refresh time every minute
		    		1000*60
		    		);

					notification_el.appendChild(notification_date);

					notification_el.classList.add('dropdown-item');
					dropdown_menu.insertBefore(notification_el,dropdown_menu.childNodes[2]);
				}
			}
		}
		dropdown_count.innerHTML = Number(dropdown_count.innerHTML)+new_dropdown_count;
		if(dropdown_count.innerHTML > 0){
			dropdown_count.style.display = 'block';
		}			
	});
}