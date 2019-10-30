export default function (nga, admin) {
    var subitlesImport = admin.getEntity('subtitlesImport');

    subitlesImport.listView()
        .title('<h4>Open Subtitles<i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .actions([])
        .batchActions([])
        .fields([
            nga.field('id')
                .label('ID'),
            nga.field('filename')
                .label('Filename'),
            nga.field('downloads')
                .label('Downloads'),
            nga.field('lang')
                .label("Language")
        ])
        .filters([
            nga.field('query')
                .label('')
                .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
                .pinned(true)
        ])
        .listActions(['<a ng-href="/admin/#/{{entry.values.route}}/edit/{{entry.values.id}}?link={{entry.values.url}}&lang={{entry.values.langcode}}">Import</a>']);

    subitlesImport.editionView()
        .title('<h4>OpenSubtitles.org Subtitles<i class="fa fa-angle-right" aria-hidden="true"></i> Import</h4>')
        .actions([''])
        .fields([
            nga.field('vod_id', 'string')
                .attributes({placeholder: "Leave empty if you are importing for Tv Episodes"})
                .label('VOD ID'),
            nga.field('tv_episode_id', 'string')
                .attributes({placeholder: "Leave empty if you are importing for VOD"})
                .label('Tv Episode ID'),
            nga.field('template')
                .template(`<div ng-controller="subController">
                          <button type="button" class="btn btn-default" ng-click="submitSubForm(entry.values.vod_id, entry.values.tv_episode_id)">✔ Import</button>
                          <div class="btn btn-small"><ma-back-button class="pull-right" label="Cancel"></ma-back-button></div>
                </div>`)
                .label('')
        ]);



    return subitlesImport;
}
