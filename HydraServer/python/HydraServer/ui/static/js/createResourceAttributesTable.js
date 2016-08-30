
function createResourceAttributesTable (res) {
        t_table=null;
        var table = $('<table></table>').addClass('table');
        //alert(nodes_attrs[i].attrr_name+", "+nodes_attrs[i].type+", "+nodes_attrs[i].values);
        var name_row = $("<tr/>");
        var name_ = $('<th></th>').text('Attribute name ' );
        name_row.append(name_);

        var res_name = $('<th></th>').text(res.attrr_name);
        name_row.append(res_name);
        table.append(name_row);

        var type_row = $("<tr/>");
        var type_ = $('<th></th>').text('Type ' );
        type_row.append(type_);

        var res_type = document.createElement("th");

         if(res.type == 'timeseries')
               res_type.innerHTML ='<a href="#">'+res.type+'</a>';
        else
               res_type.innerHTML =res.type;

         type_row.append(res_type);
        table.append(type_row);
        var graph_data={};

        if(res.type == 'timeseries')
        {
        //alert('Time series found')
        graph_data=[];
          var date_row = $("<tr/>");
           var date_ = $('<td ></td>').text('Date ' );
           var value_ = $('<td></td>').text('Value ' );

           date_row.append(date_);
           date_row.append(value_);

         var t_table = $('<table></table>').addClass('table');
         t_table.append(date_row);

         for (j in res.values)
        {
           var value_row = $("<tr/>");
           var date=new Date(res.values[j].date);
           var formateddate=toLocaleFormat(date);
           var thread=$ ('<tr></tr>');
           var res_date = $('<td></td>').text(formateddate);
           var res_value = $('<td></td>').text(res.values[j].value);

           graph_data.push(
        {
          'date': date,
          'value':res.values[j].value,
        }
        )
           value_row.append(res_date);
           value_row.append(res_value);
           t_table.append(value_row);
        }
        res_type.innerHTML ='<a href="#">'+res.type+'</a>';
        res_type.onclick =(function(){
        drawTimeseriesGraph('../static/js/_timeseries_graph.js', graph_data, res.attrr_name, t_table);
    });

        }
        else
        {
            var v_row = $("<tr/>");
            var v_title_ = $('<td></td>').text('Value ' );
            v_row.append(v_title_);
            var vv_ = $('<td></td>').text(res.values);
            v_row.append(vv_);
            table.append(v_row);
        }
    $('#data').append(table);
    if(t_table!=null)
         {
              $('#data').append(t_table);
              t_table.hide();
         }
   }
