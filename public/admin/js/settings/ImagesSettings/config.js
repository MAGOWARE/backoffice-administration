import edit_button from '../../edit_button.html';
//import set from './setting.html';

export default function (nga, admin) {
    var ImagesSettings = admin.getEntity('ImagesSettings');
    ImagesSettings.listView()
        .batchActions([])
        .fields([
            nga.field('box_logo_url', 'file')
                .label('Box Logo *')
                .template(`<div class="row">
                                <div class="col-xs-12 col-sm-1">
                                    <div ng-controller="modalController">
                                        <img ng-src="{{ entry.values.box_logo_url }}"
                                             width="45"
                                             height="45"
                                             ng-click="openModalImage(entry.values.box_logo_url)">
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.box_logo_url"></ma-file-field></div>
                               </div>
                            <div class="row"><small id="emailHelp" class="form-text text-muted">1988x318 px,not larger than 600 KB</small></div>`)
                .uploadInformation({ 'url': '/file-upload/single-file/settings/box_logo_url','apifilename': 'result'})
                .validation({
                    validator: function(value) {
                        if (value === null){
                            throw new Error('Please, choose Box Logo');
                        } else {
                            var box_logo_url = document.getElementById('box_logo_url');
                            if (box_logo_url.value.length > 0) {
                                if(box_logo_url.files[0].size > 614400 ){
                                    throw new Error('Your Box Logo is too Big, not larger than 600 KB');
                                }
                            }
                        }
                    }
                }),

            nga.field('box_background_url', 'file')
                .label('Box Background *')
                .template(`<div class="row">
                                <div class="col-xs-12 col-sm-1">
                                    <div ng-controller="modalController">
                                        <img ng-src="{{ entry.values.box_background_url }}"
                                             width="45"
                                             height="45"
                                             ng-click="openModalImage(entry.values.box_background_url)">
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.box_background_url"></ma-file-field></div>
                               </div>
                            <div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1.3 MB</small></div>`)
                .uploadInformation({ 'url': '/file-upload/single-file/settings/box_background_url','apifilename': 'result'})
                .validation({
                    validator: function(value) {
                        if(value == null){
                            throw new Error('Please, choose Box Background');
                        }else{
                            var box_background_url = document.getElementById('box_background_url');
                            if (box_background_url.value.length > 0) {
                                if(box_background_url.files[0].size > 1572864 ){
                                    throw new Error('Your Box Background is too Big, not larger than 1.3 MB');
                                }
                            }
                        }
                    }
                }),

            nga.field('mobile_background_url', 'file')
                .label('Landscape Background Mobile *')
                .template(`<div class="row">
                                <div class="col-xs-12 col-sm-1">
                                    <div ng-controller="modalController">
                                        <img ng-src="{{ entry.values.mobile_background_url }}"
                                             width="45"
                                             height="45"
                                             ng-click="openModalImage(entry.values.mobile_background_url)">
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.mobile_background_url"></ma-file-field></div>
                               </div>
                            <div class="row"><small id="emailHelp" class="form-text text-muted">540x960 px, not larger than 1 MB</small></div>`)
                .uploadInformation({ 'url': '/file-upload/single-file/settings/mobile_background_url','apifilename': 'result'})
                .validation({
                    validator: function(value) {

                        if(value == null){
                            throw new Error('Please, choose Landscape Background Mobile');
                        }else{
                            var mobile_background_url = document.getElementById('mobile_background_url');
                            if (mobile_background_url.value.length > 0) {
                                if(mobile_background_url.files[0].size > 1048576 ){
                                    throw new Error('Your Landscape Background Mobile is too Big, not larger than 1 MB');
                                }
                            }
                        }


                    }
                }),


            nga.field('portrait_background_url', 'file')
                .label('Portrait Background Mobile')
                .template(`<div class="row">
                                <div class="col-xs-12 col-sm-1">
                                    <div ng-controller="modalController">
                                        <img ng-src="{{ entry.values.portrait_background_url }}"
                                             width="45"
                                             height="45"
                                             ng-click="openModalImage(entry.values.portrait_background_url)">
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.portrait_background_url"></ma-file-field></div>
                               </div>
                            <div class="row"><small id="emailHelp" class="form-text text-muted">432x768 px, not larger than 1 MB</small></div>`)
                .uploadInformation({ 'url': '/file-upload/single-file/settings/portrait_background_url','apifilename': 'result'})
                .validation({
                    validator: function(value) {

                        if(value == null){
                            throw new Error('Please, choose Portrait Background Mobile');
                        }else{
                            var portrait_background_url = document.getElementById('portrait_background_url');
                            if (portrait_background_url.value.length > 0) {
                                if(portrait_background_url.files[0].size > 1048576 ){
                                    throw new Error('Your Portrait Background Mobile is too Big, not larger than 1 MB');
                                }
                            }
                        }


                    }
                }),

            nga.field('mobile_logo_url', 'file')
                .label('Mobile Logo *')
                .template(`<div class="row">
                                <div class="col-xs-12 col-sm-1">
                                    <div ng-controller="modalController">
                                        <img ng-src="{{ entry.values.mobile_logo_url }}"
                                             width="45"
                                             height="45"
                                             ng-click="openModalImage(entry.values.mobile_logo_url)">
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.mobile_logo_url"></ma-file-field></div>
                               </div>
                            <div class="row"><small id="emailHelp" class="form-text text-muted">240x38 px, not larger than 600 KB</small></div>`)
                .uploadInformation({ 'url': '/file-upload/single-file/settings/mobile_logo_url','apifilename': 'result'})
                .validation({
                    validator: function(value) {

                        if(value == null){
                            throw new Error('Please, choose Mobile Logo');
                        }else{
                            var mobile_logo_url = document.getElementById('mobile_logo_url');
                            if (mobile_logo_url.value.length > 0) {
                                if(mobile_logo_url.files[0].size > 614400 ){
                                    throw new Error('Your Mobile Logo is too Big, not larger than 600 KB');
                                }
                            }
                        }


                    }
                }),

            nga.field('vod_background_url', 'file')
                .label('VOD Background *')
                .template(`<div class="row">
                                <div class="col-xs-12 col-sm-1">
                                    <div ng-controller="modalController">
                                        <img ng-src="{{ entry.values.vod_background_url }}"
                                             width="45"
                                             height="45"
                                             ng-click="openModalImage(entry.values.vod_background_url)">
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.vod_background_url"></ma-file-field></div>
                               </div>
                            <div class="row"><small id="emailHelp" class="form-text text-muted">920x1080 px, not larger than 1 MB</small></div>`)
                .uploadInformation({ 'url': '/file-upload/single-file/settings/vod_background_url','apifilename': 'result'})
                .validation({
                    validator: function(value) {

                        if(value == null){
                            throw new Error('Please, choose VOD Background');
                        }else{
                            var vod_background_url = document.getElementById('vod_background_url');
                            if (vod_background_url.value.length > 0) {
                                if(vod_background_url.files[0].size > 1048576 ){
                                    throw new Error('Your VOD Background is too Big, not larger than 1 MB');
                                }
                            }
                        }


                    }
                }),

            nga.field('background_video_url', 'string')
                .validation({ required: false })
                .attributes({ placeholder: 'Background Video Url' })
                .label('Background Video Url'),

            nga.field('background_video_duration','number')
                .validation({ required: false })
                .attributes({ placeholder: 'Background Video Duration' })
                .label('Background Video Duration'),

            nga.field('company_name', 'string')
                .validation({ required: true })
                .label('Company name')
                .template('<div>'+
                    '<ma-input-field field="field" value="entry.values.company_name"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Set your company name (By default - MAGOWARE)</small>'+
                    '</div>'),
            nga.field('company_logo', 'file')
                .label('Company logo *')
                .template(`<div class="row">
                                <div class="col-xs-12 col-sm-1">
                                    <div ng-controller="modalController">
                                        <img ng-src="{{ entry.values.company_logo }}"
                                             width="45"
                                             height="45"
                                             ng-click="openModalImage(entry.values.company_logo)">
                                    </div>
                                </div>
                                <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.company_logo"></ma-file-field></div>
                               </div>
                            <div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1 MB</small></div>`)
                .uploadInformation({ 'url': '/file-upload/single-file/settings/company_logo','apifilename': 'result'})
                .validation({
                    validator: function(value) {
                        if(value == null){
                            throw new Error('Please, choose Company logo');
                        }else{
                            var company_logo = document.getElementById('company_logo');
                            if (company_logo.value.length > 0) {
                                if(company_logo.files[0].size > 1048576 ){
                                    throw new Error('Your company logo is too Big, not larger than 1 MB');
                                }
                            }
                        }


                    }
                }),

            nga.field('locale', 'string')
                .validation({ required: true })
                .label('Locale')
                .template('<div>'+
                    '<ma-input-field field="field" value="entry.values.locale"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">User interface language (not in use).</small>'+
                    '</div>'),

            nga.field('template')
                .label('')
                .template(edit_button),

        ]);

    ImagesSettings.editionView()
        .title('<h4><i class="fa fa-angle-right" aria-hidden="true"></i> Images and Logos</h4>')
        .actions([''])
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done(); // stop the progress bar
            notification.log(`Element #${entry._identifierValue} successfully edited.`, { addnCls: 'humane-flatty-success' }); // add a notification
            // redirect to the list view
            $state.go($state.current, {}, {reload : true}); // cancel the default action (redirect to the edition view)
            return false;
        }])
        .fields([
            ImagesSettings.listView().fields(),
        ]);

    return ImagesSettings;

}