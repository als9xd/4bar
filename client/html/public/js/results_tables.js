$('a[data-toggle="tab"]').on( 'shown.bs.tab', function (e) {
    $('.results-table').css('display','none');
    let table = $('#'+e.target.getAttribute('data-table-id')).closest('.results-table')[0];
    table.style.display = 'block';

    let active_field = e.target.getAttribute('data-table-id').substring(0, e.target.getAttribute('data-table-id').length - '-table'.length);
    updateQueryStringParam("active_field",active_field);
    $('input[name="active_field"').val(active_field);

    $.fn.dataTable.tables( {visible: true, api: true} ).columns.adjust();
} );

$(document).ready(function () {
    let active_field = getUrlParameter('active_field');

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

    if(getUrlParameter('scroll_to_table') === 'true'){
      $('html,body').animate({
          scrollTop: $('a[data-table-id="'+active_field+'-table"]').offset().top},
          'slow');
    }
});

