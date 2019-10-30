import edit_button from '../edit_button.html';

export default function (nga, admin) {
    var company_settings_list_company_data = admin.getEntity('company_settings_list_company_data');
    company_settings_list_company_data.listView()
        .title('<h4>Company <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .batchActions([])
        .fields([
            nga.field('id')
                .label('ID'),
            nga.field('total_accounts')
                .label('total_accounts'),
            nga.field('total_channels')
                .label('total_channels'),
            nga.field('total_vod')
                .label('total_vod'),
            nga.field('total_assets')
                .label('total_assets'),
        ])
        .filters([
            nga.field('q')
                .label('')
                .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
                .pinned(true),
        ])

    return company_settings_list_company_data;

}