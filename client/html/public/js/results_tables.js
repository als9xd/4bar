$('a[data-toggle="tab"]').on( 'shown.bs.tab', function (e) {
    $('.results-table').css('display','none');
    let table = $('#'+e.target.getAttribute('data-table-id')).closest('.results-table')[0];
    table.style.display = 'block';

    updateQueryStringParam("active_field",e.target.getAttribute('data-table-id').substring(0, e.target.getAttribute('data-table-id').length - '-table'.length));

    $.fn.dataTable.tables( {visible: true, api: true} ).columns.adjust();
} );

$(document).ready(function () {
    let active_field = getUrlParameter('active_field');

    if(typeof active_field === 'undefined' && window.location.pathname !== '/profile'){
      active_field = 'communities';
    }

    $('a[data-table-id="'+active_field+'-table"]').click();

    $('#communities-table').DataTable({
      "searching" : false,
      "responsive" : true
    });    

    $('#tournaments-table').DataTable({
      "searching" : false,
      "responsive" : true
    });    

    $('#users-table').DataTable({
      "searching" : false,
      "responsive" : true
    }); 

    if(typeof active_field !== 'undefined' && window.location.pathname === '/profile'){
      $('html,body').animate({
          scrollTop: $('a[data-table-id="'+active_field+'-table"]').offset().top},
          'slow');
    }
});

