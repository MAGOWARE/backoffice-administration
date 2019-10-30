import edit_button from '../edit_button.html';

export default function (nga, admin) {
    var app_gr = admin.getEntity('appgroup');
    app_gr.listView()
        .title('<h4>App Group <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .batchActions([])
        .fields([
            nga.field('app_id')
                .map(function app(value) {
                    if (value === 1) {
                        return '1 - Android Set Top Box';
                    } else if (value === 2) {
                        return '2 - Android Mobile';
                    } else if (value === 3) {
                        return '3 - Ios Mobile';
                    } else if (value === 4) {
                        return '4 - Android Smart TV';
                    } else if (value === 5) {
                        return '5 - Web TV';
                    } else if (value === 6) {
                        return '6 - Apple TV';
                    }
                })
                .label('App ID'),
            nga.field('app_group_id')
                .map(function app(value) {
                    if (value === 1) {
                        return '1 - Large Screen';
                    } else if (value === 2) {
                        return '2 - Small Screen';
                    }
                })
                .label('App Group ID'),
            // nga.field('app_group_name')
            // 	.label('App Group Name'),

        ])
        .listActions([])
        .exportFields([
            app_gr.listView().fields(),
        ]);


    app_gr.creationView()
        .title('<h4>App Group <i class="fa fa-angle-right" aria-hidden="true"></i> Create: APP</h4>')
        .fields([
            nga.field('app_group_id')
                .attributes({ placeholder: 'App Group ID' })
                .validation({ required: true })
                .label('App Group ID'),
            nga.field('app_group_name')
                .attributes({ placeholder: 'App Group Name' })
                .validation({ required: true })
                .label('App Group Name'),
            nga.field('app_id')
                .attributes({ placeholder: 'App ID' })
                .validation({ required: true })
                .label('App ID'),

            nga.field('template')
                .label('')
                .template(edit_button),
        ]);


    return app_gr;

}