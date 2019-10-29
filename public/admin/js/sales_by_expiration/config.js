import exp_graph from './expiration_graph.html'

export default function(nga, admin) {
  var salesreport = admin.getEntity('sales_by_expiration')
  salesreport
    .listView()
    .title(
      `<h4>Expirations list <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>`
    )
    .batchActions([])
    .fields([
      nga.field('login_datum.username', 'string').label('Client'),
      nga
        .field('end_date', 'date')
        .cssClasses('hidden-xs')
        .label('Expiration date')
    ])
    .filters([
      nga.field('username', 'string').attributes({ placeholder: 'Client' }),
      nga
        .field('startsaledate', 'date')
        .attributes({ placeholder: 'From date' })
        .label('From date'),
      nga
        .field('endsaledate', 'date')
        .attributes({ placeholder: 'To date' })
        .label('To date'),
      nga
        .field('next', 'string')
        .attributes({ placeholder: 30 })
        .label('Expires in (days)')
    ])
    .exportFields([salesreport.listView().fields()])

  return salesreport
}
