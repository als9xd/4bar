//////////////////////////////////////////////////////////////////////
// 4bar/client/html/public/js/UrlMessageHandler.js
//
// Overview: 
//  - Provides an interface for receiving messages from the server 
//    using url query paramaters
//
//////////////////////////////////////////////////////////////////////

function get_url_parameter(name,url){
    if (!url){
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results){
      return null;
    }
    if (!results[2]){ 
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const url_msg = get_url_parameter('message');

if(url_msg){
  let msg_alert = document.createElement('div');
  msg_alert.classList.add('alert','alert-success');
  msg_alert.setAttribute('role','alert');
  msg_alert.innerHTML = url_msg;
  document.getElementById('success_container').appendChild(msg_alert);
}
const url_error = get_url_parameter('error');
if(url_error){
  let error_alert = document.createElement('div');
  error_alert.classList.add('alert','alert-danger');
  error_alert.setAttribute('role','alert');
  error_alert.innerHTML = '<strong>Error: </strong>';
  var url_error_split = url_error.split(',');
  for(var i in url_error_split){
    error_alert.innerHTML+="<li>"+url_error_split[i]+"</li>";
  }
  document.getElementById('error_container').appendChild(error_alert);
}