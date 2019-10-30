import edit_button from '../edit_button.html';

export default function (nga, admin) {
	var company_settings = admin.getEntity('company_settings');
	company_settings.listView()
			.title('<h4>Company <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
			.batchActions([])
			.fields([
                nga.field('id', 'number')
                    .label('ID'),
				nga.field('company_name', 'string')
						.label('Company name'),
				nga.field('locale', 'string')
						.label('Language'),
                nga.field('id', 'reference')
                    .targetEntity(admin.getEntity('company_settings_list_company_data'))
                    .targetField(nga.field('total_accounts'))
                    .label('Total Accounts'),
                nga.field('id', 'reference')
                    .targetEntity(admin.getEntity('company_settings_list_company_data'))
                    .targetField(nga.field('total_channels'))
                    .label('Total Channels'),
                nga.field('id', 'reference')
                    .targetEntity(admin.getEntity('company_settings_list_company_data'))
                    .targetField(nga.field('total_vod'))
                    .label('Total Vods'),
                nga.field('id', 'reference')
                    .targetEntity(admin.getEntity('company_settings_list_company_data'))
                    .targetField(nga.field('total_assets'))
                    .label('Total Assets'),
                nga.field('expire_date', 'date')
                    .label('Expire Date')
			])
			.filters([
				nga.field('q')
						.label('')
						.template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
						.pinned(true),
			])
			.listActions(['edit'])
			.exportFields([
				company_settings.listView().fields(),
			]);


	company_settings.creationView()
			.title('<h4>Company Settings <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Settings </h4>')
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            notification.log('Successfully created', { addnCls: 'humane-flatty-success' });
            $state.go($state.get('edit'), { entity: 'company_settings', id: entry.values.id });
            return false;
        }])
			.fields([
				nga.field('company_name', 'string')
                    .attributes({ placeholder: 'Company Name' })
						.validation({ required: true })
						.label('Company name')
						.template('<div>'+
								'<ma-input-field field="field" value="entry.values.company_name"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Set your company name (By default - MAGOWARE)</small>'+
								'</div>'),

                nga.field('company_url', 'string')
                    .validation({ required: true })
                    .attributes({ placeholder: 'Company website' }),

                nga.field('email')
                    .validation({ required: true })
                    .label('Owner Email')
                    .template('<div>'+
                        '<ma-input-field field="field" value="entry.values.email"></ma-input-field>'+
                        '<small id="emailHelp" class="form-text text-muted">Email address of the owner.</small>'+
                        '</div>')
                    .attributes({ placeholder: 'Email' }),

                nga.field('email_address')
                	.validation({ required: true })
                    .label('Email Address')
                    .template('<div>'+
                        '<ma-input-field field="field" value="entry.values.email_address"></ma-input-field>'+
                        '<small id="emailHelp" class="form-text text-muted">Email address appearing in the email details.</small>'+
                        '</div>')
                    .attributes({ placeholder: 'Address' }),
                nga.field('email_username')
					.validation({ required: true })
                    .label('Email Username')
                    .template('<div>'+
                        '<ma-input-field field="field" value="entry.values.email_username"></ma-input-field>'+
                        '<small id="emailHelp" class="form-text text-muted">Username for outgoing smtp mail server.</small>'+
                        '</div>')
                    .attributes({ placeholder: 'Username' }),
                nga.field('email_password', 'password')
                	.validation({ required: true })
                    .label('Email Password')
                    .template('<div>'+
                        '<ma-input-field field="field" type="password" value="entry.values.email_password"></ma-input-field>'+
                        '<small id="emailHelp" class="form-text text-muted">Password for outgoing smtp mail server.</small>'+
                        '</div>')
                    .attributes({ placeholder: 'Password' }),

                nga.field('template')
                    .label('')
                    .template(edit_button),




				//hidden field for creation view
				nga.field('company_logo', 'file')
					.label('')
					.defaultValue('/files/settings/mago.png')
					.cssClasses('hidden')
						.template('<div class="row">'+
								'<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.company_logo }}" height="40" width="40" /></div>'+
								'<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.company_logo"></ma-file-field></div>'+
								'</div>'+
								'<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1 MB</small></div>')
						.uploadInformation({ 'url': '/file-upload/single-file/settings/company_logo','apifilename': 'result'})
						.validation({ required: true, validator: function() {
							var company_logo = document.getElementById('company_logo');
							if (company_logo.value.length > 0) {
								if(company_logo.files[0].size > 1048576 ){
									throw new Error('Your company logo is too Big, not larger than 1 MB');
								}
							}
						}
						}),


				nga.field('asset_limitations.client_limit', 'number')
						// .validation({ required: true })
					.defaultValue('')
					.label('')
					.cssClasses('hidden')
					.attributes({ placeholder: 'Client limitation' }),
				nga.field('asset_limitations.channel_limit', 'number')
                    .defaultValue('')
                    .label('')
                    .cssClasses('hidden')
						// .validation({ required: true })
					.attributes({ placeholder: 'Channel limitation' }),
				nga.field('asset_limitations.vod_limit', 'number')
                    .defaultValue('')
                    .label('')
                    .cssClasses('hidden')
						// .validation({ required: true })
					.attributes({ placeholder: 'Vod item limitation' }),
				nga.field('locale', 'string')
						// .validation({ required: true })
					.defaultValue('en')
                    .cssClasses('hidden')
					.label('')
					.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.locale"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">User interface language (not in use).</small>'+
								'</div>'),
				nga.field('log_event_interval', 'number')
						// .validation({ required: true })
						.defaultValue(300)
                    	.cssClasses('hidden')
						.label('')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.log_event_interval"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Interval between event logs</small>'+
								'</div>'),
				nga.field('mobile_background_url', 'file')
                    .defaultValue('/files/settings/mago.png')
						.label('')
                    	.cssClasses('hidden')
						.template('<div class="row">'+
								'<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.mobile_background_url }}" height="40" width="40" /></div>'+
								'<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.mobile_background_url"></ma-file-field></div>'+
								'</div>'+
								'<div class="row"><small id="emailHelp" class="form-text text-muted">566x318 px, not larger than 1 MB</small></div>')
						.uploadInformation({ 'url': '/file-upload/single-file/settings/mobile_background_url','apifilename': 'result'})
						.validation({ required: true, validator: function() {
							var mobile_background_url = document.getElementById('mobile_background_url');
							if (mobile_background_url.value.length > 0) {
								if(mobile_background_url.files[0].size > 1048576 ){
									throw new Error('Your Mobile Background is too Big, not larger than 1 MB');
								}
							}
						}
						}),
				nga.field('mobile_logo_url', 'file')
                    .defaultValue('/files/settings/mago.png')
						.label('')
                    	.cssClasses('hidden')
						.template('<div class="row">'+
								'<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.mobile_logo_url }}" height="40" width="40" /></div>'+
								'<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.mobile_logo_url"></ma-file-field></div>'+
								'</div>'+
								'<div class="row"><small id="emailHelp" class="form-text text-muted">240x38 px, not larger than 600 KB</small></div>')
						.uploadInformation({ 'url': '/file-upload/single-file/settings/mobile_logo_url','apifilename': 'result'})
						.validation({ required: true, validator: function() {
							var mobile_logo_url = document.getElementById('mobile_logo_url');
							if (mobile_logo_url.value.length > 0) {
								if(mobile_logo_url.files[0].size > 614400 ){
									throw new Error('Your Mobile Logo is too Big, not larger than 600 KB');
								}
							}
						}
						}),
				nga.field('box_logo_url', 'file')
                    .defaultValue('/files/settings/mago.png')
						.label('')
					 	.cssClasses('hidden')
						.template('<div class="row">'+
								'<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.box_logo_url }}" height="40" width="40" /></div>'+
								'<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.box_logo_url"></ma-file-field></div>'+
								'</div>'+
								'<div class="row"><small id="emailHelp" class="form-text text-muted">1988x318 px,not larger than 600 KB</small></div>')
						.uploadInformation({ 'url': '/file-upload/single-file/settings/box_logo_url','apifilename': 'result'})
						.validation({ required: true, validator: function() {
							var box_logo_url = document.getElementById('box_logo_url');
							if (box_logo_url.value.length > 0) {
								if(box_logo_url.files[0].size > 614400 ){
									throw new Error('Your Box Logo is too Big, not larger than 600 KB');
								}
							}
						}
						}),

				nga.field('box_background_url', 'file')
                    .defaultValue('/files/settings/mago.png')
						.label('')
                    	.cssClasses('hidden')
						.template('<div class="row">'+
								'<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.box_background_url }}" height="40" width="40" /></div>'+
								'<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.box_background_url"></ma-file-field></div>'+
								'</div>'+
								'<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1.3 MB</small></div>')
						.uploadInformation({ 'url': '/file-upload/single-file/settings/box_background_url','apifilename': 'result'})
						.validation({ required: true, validator: function() {
							var box_background_url = document.getElementById('box_background_url');
							if (box_background_url.value.length > 0) {
								if(box_background_url.files[0].size > 1572864 ){
									throw new Error('Your Box Background is too Big, not larger than 1.3 MB');
								}
							}
						}
						}),
				nga.field('vod_background_url', 'file')
                    .defaultValue('/files/settings/mago.png')
						.label('')
                    	.cssClasses('hidden')
						.template('<div class="row">'+
								'<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.vod_background_url }}" height="40" width="40" /></div>'+
								'<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.vod_background_url"></ma-file-field></div>'+
								'</div>'+
								'<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1 MB</small></div>')
						.uploadInformation({ 'url': '/file-upload/single-file/settings/vod_background_url','apifilename': 'result'})
						.validation({ required: true, validator: function() {
							var vod_background_url = document.getElementById('vod_background_url');
							if (vod_background_url.value.length > 0) {
								if(vod_background_url.files[0].size > 1048576 ){
									throw new Error('Your VOD Background is too Big, not larger than 1 MB');
								}
							}
						}
						}),
				nga.field('assets_url', 'string')
						// .validation({ required: true })
					.defaultValue('')
                    .cssClasses('hidden')
						.label('')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.assets_url"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">URL to provide images through a CDN.</small>'+
								'</div>')
						.attributes({ placeholder: 'Assets URL' }),
				nga.field('ip_service_url', 'string')
						// .validation({ required: true })
					.defaultValue('')
                    .cssClasses('hidden')
						.label('')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.ip_service_url"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Service providing with device timezone.</small>'+
								'</div>')
						.attributes({ placeholder: 'IP service URL' }),
				nga.field('ip_service_key', 'text')
                    .defaultValue('')
                    .cssClasses('hidden')
						// .validation({ required: true })
						.label(''),
				nga.field('firebase_key', 'text')
                    .defaultValue('')
                    .cssClasses('hidden')
						// .validation({ required: true })
						.label(''),
				nga.field('help_page', 'string')
                    .defaultValue('')
                    .cssClasses('hidden')
						// .validation({ required: true })
						.label('')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.help_page"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Configure application help page (By default /help_and_support)</small>'+
								'</div>'),
				nga.field('online_payment_url', 'string')
                    .defaultValue('')
                    .cssClasses('hidden')
						// .validation({ required: true })
						.label('')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.online_payment_url"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Configure web page for online payments from application</small>'+
								'</div>'),
				nga.field('vod_subset_nr' ,'number')
						.defaultValue(200)
                    .cssClasses('hidden')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.vod_subset_nr"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Number of movies sent in each vod request</small>'+
								'</div>')
						.label(''),
				nga.field('activity_timeout' ,'number')
						.defaultValue(10800)
                    .cssClasses('hidden')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.activity_timeout"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Number of seconds to wait before screen goes black due to inactivity</small>'+
								'</div>')
						.label(''),
				nga.field('channel_log_time' ,'number')
						.defaultValue(6)
                    .cssClasses('hidden')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.channel_log_time"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Number of seconds to wait before sending log due to channel stream buffering</small>'+
								'</div>')
						.label(''),



				nga.field('smtp_host')
                    .defaultValue('')
						// .validation({ required: true })
                    .cssClasses('hidden')
						.label('')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.smtp_host"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Smtp host and port (smtp_host:port)</small>'+
								'</div>')
						.attributes({ placeholder: 'smtp.gmail.com:465' }),
				nga.field('smtp_secure', 'choice')
						.defaultValue(true)
                    .cssClasses('hidden')
						.choices([
							{ value: false, label: 'Disable secure connection with Smtp server' },
							{ value: true, label: 'Enable secure connection with Smtp server' }
						])
						// .validation({ required: true})
						.template('<div class="form-group">'+
								'<ma-choice-field field="field" value="entry.values.smtp_secure"></ma-choice-field>'+
								'<small id="emailHelp" class="form-text text-muted">Consider your Smtp host configurations for this setting </small>'+
								'</div>')
						.label(''),
				nga.field('analytics_id' ,'string')
                    .defaultValue('')
                    .cssClasses('hidden')
						.attributes({ placeholder: 'Analytics ID' })
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.analytics_id"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Google analytics ID to monitor audience and system logs.</small>'+
								'</div>')
						.label(''),

				nga.field('new_encryption_key' ,'string')
						.attributes({ placeholder: 'Current encryption key' })
						.defaultValue('0123456789abcdef')
                    .cssClasses('hidden')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.new_encryption_key"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Current key. Used to decrypt the authentification token sent by the device</small>'+
								'</div>')
						.label(''),
				nga.field('old_encryption_key' ,'string')
						.attributes({ placeholder: 'Previous encryption key' })
						.defaultValue('0123456789abcdef')
                    .cssClasses('hidden')
						.template('<div class="form-group">'+
								'<ma-input-field field="field" value="entry.values.old_encryption_key"></ma-input-field>'+
								'<small id="emailHelp" class="form-text text-muted">Previous encryption key. If key transition is checked and the new key fails, attempt to use this key for authetification </small>'+
								'</div>')
						.label(''),
				nga.field('key_transition' ,'string')
						.defaultValue(false)
                    .cssClasses('hidden')
						.label(''),

			])


	company_settings.editionView()
			.title('<h4>Company Setting <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.username }}</h4>')
			.actions(['list'])
        .fields([
            nga.field('company_name', 'string')
                .validation({ required: true })
                .label('Company name')
                .template('<div>'+
                    '<ma-input-field field="field" value="entry.values.company_name"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Set your company name (By default - MAGOWARE)</small>'+
                    '</div>'),
            nga.field('company_logo', 'file')
                .label('Company logo')
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.company_logo }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.company_logo"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1 MB</small></div>')
                .uploadInformation({ 'url': '/file-upload/single-file/settings/company_logo','apifilename': 'result'})
                .validation({ required: true, validator: function() {
                        var company_logo = document.getElementById('company_logo');
                        if (company_logo.value.length > 0) {
                            if(company_logo.files[0].size > 1048576 ){
                                throw new Error('Your company logo is too Big, not larger than 1 MB');
                            }
                        }
                    }
                }),
            nga.field('company_url', 'string')
                .validation({ required: true })
                .attributes({ placeholder: 'Company website' }),

            nga.field('asset_limitations.client_limit', 'number')
                .validation({ required: true })
                .attributes({ placeholder: 'Client limitation' }),
            nga.field('asset_limitations.channel_limit', 'number')
                .validation({ required: true })
                .attributes({ placeholder: 'Channel limitation' }),
            nga.field('asset_limitations.vod_limit', 'number')
                .validation({ required: true })
                .attributes({ placeholder: 'Vod item limitation' }),


            nga.field('locale', 'string')
                .validation({ required: true })
                .defaultValue('en')
                .label('Language')
                .template('<div>'+
                    '<ma-input-field field="field" value="entry.values.locale"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">User interface language (not in use).</small>'+
                    '</div>'),
            nga.field('log_event_interval', 'number')
                .validation({ required: true })
                .defaultValue(300)
                .label('Log event interval')
                .template('<div>'+
                    '<ma-input-field field="field" value="entry.values.log_event_interval"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Interval between event logs</small>'+
                    '</div>'),
            nga.field('mobile_background_url', 'file')
                .label('Mobile Background')
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.mobile_background_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.mobile_background_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">566x318 px, not larger than 1 MB</small></div>')
                .uploadInformation({ 'url': '/file-upload/single-file/settings/mobile_background_url','apifilename': 'result'})
                .validation({ required: true, validator: function() {
                        var mobile_background_url = document.getElementById('mobile_background_url');
                        if (mobile_background_url.value.length > 0) {
                            if(mobile_background_url.files[0].size > 1048576 ){
                                throw new Error('Your Mobile Background is too Big, not larger than 1 MB');
                            }
                        }
                    }
                }),
            nga.field('mobile_logo_url', 'file')
                .label('Mobile Logo')
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.mobile_logo_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.mobile_logo_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">240x38 px, not larger than 600 KB</small></div>')
                .uploadInformation({ 'url': '/file-upload/single-file/settings/mobile_logo_url','apifilename': 'result'})
                .validation({ required: true, validator: function() {
                        var mobile_logo_url = document.getElementById('mobile_logo_url');
                        if (mobile_logo_url.value.length > 0) {
                            if(mobile_logo_url.files[0].size > 614400 ){
                                throw new Error('Your Mobile Logo is too Big, not larger than 600 KB');
                            }
                        }
                    }
                }),
            nga.field('box_logo_url', 'file')
                .label('Box Logo')
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.box_logo_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.box_logo_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">1988x318 px,not larger than 600 KB</small></div>')
                .uploadInformation({ 'url': '/file-upload/single-file/settings/box_logo_url','apifilename': 'result'})
                .validation({ required: true, validator: function() {
                        var box_logo_url = document.getElementById('box_logo_url');
                        if (box_logo_url.value.length > 0) {
                            if(box_logo_url.files[0].size > 614400 ){
                                throw new Error('Your Box Logo is too Big, not larger than 600 KB');
                            }
                        }
                    }
                }),

            nga.field('box_background_url', 'file')
                .label('Box Background')
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.box_background_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.box_background_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1.3 MB</small></div>')
                .uploadInformation({ 'url': '/file-upload/single-file/settings/box_background_url','apifilename': 'result'})
                .validation({ required: true, validator: function() {
                        var box_background_url = document.getElementById('box_background_url');
                        if (box_background_url.value.length > 0) {
                            if(box_background_url.files[0].size > 1572864 ){
                                throw new Error('Your Box Background is too Big, not larger than 1.3 MB');
                            }
                        }
                    }
                }),
            nga.field('vod_background_url', 'file')
                .label('VOD Background')
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.vod_background_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.vod_background_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1080 px, not larger than 1 MB</small></div>')
                .uploadInformation({ 'url': '/file-upload/single-file/settings/vod_background_url','apifilename': 'result'})
                .validation({ required: true, validator: function() {
                        var vod_background_url = document.getElementById('vod_background_url');
                        if (vod_background_url.value.length > 0) {
                            if(vod_background_url.files[0].size > 1048576 ){
                                throw new Error('Your VOD Background is too Big, not larger than 1 MB');
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

            nga.field('assets_url', 'string')
                .validation({ required: true })
                .label('Assets URL')
                .template('<div>'+
                    '<ma-input-field field="field" value="entry.values.assets_url"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">URL to provide images through a CDN.</small>'+
                    '</div>')
                .attributes({ placeholder: 'Assets URL' }),
            nga.field('ip_service_url', 'string')
                .validation({ required: true })
                .label('IP service URL')
                .template('<div>'+
                    '<ma-input-field field="field" value="entry.values.ip_service_url"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Service providing with device timezone.</small>'+
                    '</div>')
                .attributes({ placeholder: 'IP service URL' }),
            nga.field('ip_service_key', 'text')
                .validation({ required: true })
                .label('IP service key'),
            nga.field('firebase_key', 'text')
                .validation({ required: true })
                .label('Firebase key'),
            nga.field('help_page', 'string')
                .validation({ required: true })
                .label('Help and Support website')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.help_page"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Configure application help page (By default /help_and_support)</small>'+
                    '</div>'),
            nga.field('online_payment_url', 'string')
                .validation({ required: true })
                .label('Online payment web page')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.online_payment_url"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Configure web page for online payments from application</small>'+
                    '</div>'),
            nga.field('vod_subset_nr' ,'number')
                .defaultValue(200)
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.vod_subset_nr"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Number of movies sent in each vod request</small>'+
                    '</div>')
                .label('Vod movies / request'),
            nga.field('activity_timeout' ,'number')
                .defaultValue(10800)
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.activity_timeout"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Number of seconds to wait before screen goes black due to inactivity</small>'+
                    '</div>')
                .label('Inactivity Timeout'),
            nga.field('channel_log_time' ,'number')
                .defaultValue(6)
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.channel_log_time"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Number of seconds to wait before sending log due to channel stream buffering</small>'+
                    '</div>')
                .label('Channel log time'),
            nga.field('email_address')
                .validation({ required: true })
                .label('Email Address')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.email_address"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Email address appearing in the email details.</small>'+
                    '</div>')
                .attributes({ placeholder: 'Address' }),
            nga.field('email_username')
                .validation({ required: true })
                .label('Email Username')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.email_username"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Username for outgoing smtp mail server.</small>'+
                    '</div>')
                .attributes({ placeholder: 'Username' }),
            nga.field('email_password', 'password')
                .validation({ required: true })
                .label('Email Password')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" type="password" value="entry.values.email_password"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Password for outgoing smtp mail server.</small>'+
                    '</div>')
                .attributes({ placeholder: 'Password' }),
            nga.field('smtp_host')
                .validation({ required: true })
                .label('Smtp host')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.smtp_host"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Smtp host and port (smtp_host:port)</small>'+
                    '</div>')
                .attributes({ placeholder: 'smtp.gmail.com:465' }),
            nga.field('smtp_secure', 'choice')
                .defaultValue(true)
                .choices([
                    { value: false, label: 'Disable secure connection with Smtp server' },
                    { value: true, label: 'Enable secure connection with Smtp server' }
                ])
                .validation({ required: true})
                .template('<div class="form-group">'+
                    '<ma-choice-field field="field" value="entry.values.smtp_secure"></ma-choice-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Consider your Smtp host configurations for this setting </small>'+
                    '</div>')
                .label('Secure connection'),
            nga.field('analytics_id' ,'string')
                .attributes({ placeholder: 'Analytics ID' })
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.analytics_id"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Google analytics ID to monitor audience and system logs.</small>'+
                    '</div>')
                .label('Analytics ID'),

            nga.field('new_encryption_key' ,'string')
                .attributes({ placeholder: 'Current encryption key' })
                .defaultValue('0123456789abcdef')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.new_encryption_key"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Current key. Used to decrypt the authentification token sent by the device</small>'+
                    '</div>')
                .label('Current encryption key'),
            nga.field('old_encryption_key' ,'string')
                .attributes({ placeholder: 'Previous encryption key' })
                .defaultValue('0123456789abcdef')
                .template('<div class="form-group">'+
                    '<ma-input-field field="field" value="entry.values.old_encryption_key"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">Previous encryption key. If key transition is checked and the new key fails, attempt to use this key for authetification </small>'+
                    '</div>')
                .label('Previous encryption key'),
            nga.field('key_transition' ,'string')
                .defaultValue(false)
                .label('Key transition'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);

	return company_settings;

}