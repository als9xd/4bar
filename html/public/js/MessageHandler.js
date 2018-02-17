function MessageHandler(toastr,socket,callbacks){
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
    }

    socket.on('message',function(message){
        if(message.error){
            toastr.error(message.error);
            if(callbacks && callbacks.on_error){
                callbacks.on_success(message);
            }
        }
        if(message.success){
            toastr.success(message.success);
            if(callbacks && callbacks.on_success){
                callbacks.on_success(message);
            }
        }
    });  
}
