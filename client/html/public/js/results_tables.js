$(document).ready(function($) {

    let table_titles = $(".search-results-table-title");

    let tables = {};

    for(let i = 0; i < table_titles.length;i++){
      tables[table_titles[i].id] = document.getElementById(table_titles[i].getAttribute('data-toggle'));
    }

    $('html').click(function(evt){    
     if($(evt.target).closest('#search-results-container').length)
        return;       

      for(let i = 0; i < table_titles.length;i++){
        table_titles[i].style.background = '#292b2c';
        table_titles[i].parentElement.appendChild(tables[table_titles[i].id]);
        table_titles[i].parentElement.classList.remove('disabled-col');
        table_titles[i].parentElement.classList.add('col-sm');
        $(tables[table_titles[i].id]).find('.extra').css('display','none');
      }

    });                    

    $(".search-results-table-title").click(function() {
        for(let i = 0; i < table_titles.length;i++){
          // console.log($(table_titles[i]).attr('id'), $(this).attr('id'));
          if($(table_titles[i]).attr('id') !== $(this).attr('id')){
              table_titles[i].style.background = '#292b2c';
              let table = document.getElementById(table_titles[i].getAttribute('data-toggle'));
              if(table){
                table_titles[i].parentElement.removeChild(
                  table
                );
              }
              table_titles[i].parentElement.classList.remove('col-sm');
              table_titles[i].parentElement.classList.add('disabled-col');
          }else{
              table_titles[i].style.background = 'rgba(0,0,0,0.7)';
              table_titles[i].parentElement.appendChild(tables[table_titles[i].id]);
              table_titles[i].parentElement.classList.remove('disabled-col');
              table_titles[i].parentElement.classList.add('col-sm');
              $(tables[table_titles[i].id]).find('.extra').css('display','table-cell');
          }
        }
    });
});
