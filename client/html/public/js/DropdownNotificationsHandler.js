let DropdownNotificationsHandler = function(socket) {
	socket.emit('dropdown_notifications_req');
	let dropdown_menu = document.getElementById('notification-dropdown-menu');
	socket.on('dropdown_notifications_res',function(notifications){
		for(let i = 0; i < notifications.length;i++){
			let notification_el = document.createElement('a');
			notification_el.href = notifications[i].url;

			let notification_avatar = document.createElement('img');
			notification_avatar.src = notifications[i].avatar === null ? '/site/no-avatar.jpg': '/avatar/'+notifications[i].avatar;
			notification_avatar.classList.add('d-inline-block');
			notification_el.appendChild(notification_avatar)

			let notification_text = document.createElement('h6');
			notification_text.style.marginLeft = "5px";
			notification_text.innerHTML = notifications[i].notification;
			notification_text.classList.add('d-inline-block');
			notification_el.appendChild(notification_text);

			let old_date = new Date(notifications[i].date);

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
	});
}