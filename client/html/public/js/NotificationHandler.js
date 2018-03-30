//////////////////////////////////////////////////////////////////////
// 4bar/client/html/public/js/NotificationHandler.js
//
// Overview: 
//  - Provides an interface for receiving messages from the server 
//    using socket.io and displaying them on the client using 
//    toaster.js 
//
// To send an error message from the back-end, within the socket listener use:
// 
// socket.emit('notificication',
//  {
//      title : >>title_of_message<<, 
//      error: >>error_message<<
//  }
// );
//
// To send an success message from the back-end, within the socket listener use:
//
// socket.emit('notificication',
//  {
//      title : >>title_of_message<<, 
//      success: >>success_message<<
//  }
// );
//
// Note: >>error_message<< and >>success_message<< can be either a string 
// or an array of strings.
//
//
// More about toaster.js:
//
//   https://github.com/CodeSeven/toastr/blob/master/README.md
// 
// More about socket.io:
//   
//   https://socket.io/docs/
//
//////////////////////////////////////////////////////////////////////


function NotificationHandler(toastr,socket,callbacks){
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-center",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    this.build_notification = function(notification){
        if(notification.error){
            toastr.options.closeButton = true;
            toastr.options.timeOut = 0;
            toastr.options.preventDuplicates = true;

            let error_msg = '';
            if(typeof(notification.error) == 'object'){
                for(let i in notification.error){
                    if(notification.error.hasOwnProperty(i)){
                        error_msg+='- '+notification.error[i]+'<br>';
                    }
                }
                notification.error = error_msg;
            }


            if(callbacks && callbacks.on_error){
                callbacks.on_error(notification);
            }
            
            if(notification.title){
                toastr.error(notification.error,notification.title);
            }else{
                toastr.error(notification.error);
            }
            

            toastr.options.closeButton = false;
            toastr.options.timeOut = 5000;
            toastr.options.preventDuplicates = false;
        }

        if(notification.success){
            let success_msg = '';
            if(typeof(notification.success) == 'object'){
                for(let i in notification.success){
                    if(notification.success.hasOwnProperty(i)){
                        success_msg+='- '+notification.success[i]+'<br>';
                    }
                }    
                notification.success = success_msg;
            }


            if(callbacks && callbacks.on_success){
                callbacks.on_success(notification);
            }

            if(notification.title){
                toastr.success(notification.success,notification.title);
            }else{
                toastr.success(notification.success);
            }
        }        
    }
    
    socket.on('notification',function(notification){
        build_notification(notification);
    });  

    return this;
}
