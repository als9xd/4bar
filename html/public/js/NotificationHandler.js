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
    
    socket.on('notification',function(notification){
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
            }else{
                if(notification.title){
                    toastr.error(notification.error,notification.title);
                }else{
                    toastr.error(notification.error);
                }
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
            }else{
                if(notification.title){
                    toastr.success(notification.success,notification.title);
                }else{
                    toastr.success(notification.success);
                }
            }
        }

    });  
}
