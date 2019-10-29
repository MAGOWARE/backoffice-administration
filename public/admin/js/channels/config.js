import edit_button from '../edit_button.html'
import modalImage from '../../templates/modalTemplate.html'

export default function(nga, admin) {
  var channels = admin.getEntity('Channels')

  channels
    .listView()
    .title(
      '<h4>Channels <i class="fa fa-angle-right" aria-hidden="true"></i> List </h4>'
    )
    .batchActions([])
    .fields([
      nga.field('channel_number', 'string').label('Number'),
      nga
        .field('title', 'string')
        .isDetailLink(false)
        .label('Title'),
      nga.field('epg_map_id', 'string').label('EPG MAP ID'),
      nga
        .field('genre_id', 'reference')
        .targetEntity(admin.getEntity('Genres'))
        .targetField(nga.field('description'))
        .isDetailLink(false)
        .label('Genres'),
      nga
        .field('icon_url', 'file')
        .template(modalImage)
        .cssClasses('hidden-xs')
        .label('Icon'),
      nga
        .field('packages_channels')
        .cssClasses('hidden')
        .map(function getpckgid(value, entry) {
          var return_object = []
          for (var i = 0; i < value.length; i++) {
            return_object[i] = value[i].package_id
          }
          return return_object
        })
        .label('Packages Channels'),
      nga
        .field('packages_channels', 'reference_many')
        .targetEntity(admin.getEntity('Packages'))
        .targetField(nga.field('package_name'))
        .singleApiCall(function(package_id) {
          return { 'package_id[]': package_id }
        })
        .label('Packages'),
      nga
        .field('description', 'text')
        .cssClasses('hidden-xs')
        .label('Description'),
      nga.field('isavailable', 'boolean').label('Available'),
      nga.field('pin_protected', 'boolean').label('Pin Protected')
    ])
    .sortDir('ASC')
    .sortField('channel_number')
    .filters([
      nga
        .field('isavailable', 'boolean')
        .filterChoices([
          { value: true, label: 'Available' },
          { value: false, label: 'Not Available' }
        ])
        .label('Available'),
      nga
        .field('q')
        .label('')
        .template(
          '<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>'
        )
        .pinned(true)
    ])
    .listActions(['edit'])

    .exportFields([channels.listView().fields()])

  channels
    .deletionView()
    .title(
      '<h4>Channels <i class="fa fa-angle-right" aria-hidden="true"></i> Remove <span style ="color:red;"> {{ entry.values.title }}'
    )
    .actions([
      '<ma-back-button entry="entry" entity="entity"></ma-back-button>'
    ])

  channels
    .creationView()
    .title(
      '<h4>Channels <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Channel</h4>'
    )
    .onSubmitSuccess([
      'progression',
      'notification',
      '$state',
      'entry',
      'entity',
      function(progression, notification, $state, entry, entity) {
        // stop the progress bar
        progression.done()
        // add a notification
        $state.go($state.get('edit'), {
          entity: entity.name(),
          id: entry._identifierValue
        })
        // cancel the default action (redirect to the edition view)
        return false
      }
    ])
    .onSubmitError([
      'error',
      'form',
      'progression',
      'notification',
      function(error, form, progression, notification) {
        progression.done() // stop the progress bar
        return false
      }
    ])
    .fields([
      nga
        .field('title', 'string')
        .attributes({ placeholder: 'Channel name' })
        .validation({ required: true })
        .label('Title'),
      nga
        .field('epg_map_id', 'string')
        .template(
          '<ma-input-field field="field" value="entry.values.epg_map_id"></ma-input-field>' +
            '<small id="emailHelp" class="form-text text-muted">Identifier used to match epg files with the respective channel</small>'
        )
        .label('EPG MAP ID'),
      nga
        .field('channel_number', 'number')
        .attributes({ placeholder: 'Must be number' })
        .validation({ required: true })
        .label('Number'),
      nga
        .field('genre_id', 'reference')
        .targetEntity(admin.getEntity('Genres'))
        .targetField(nga.field('description'))
        .remoteComplete(true, {
          refreshDelay: 300,
          searchQuery: function(search) {
            return { q: search }
          }
        })
        .validation({
          validator: function(value) {
            if (value === null || value === '') {
              throw new Error('Please Select Genre')
            }
          }
        })
        .attributes({
          placeholder:
            'Choose from dropdown list one of the genres you already created'
        })
        .label('Genre *'),
      nga
        .field('description', 'text')
        .attributes({
          placeholder:
            'You can specify data you need to know for the channel in this field'
        })
        .validation({ required: true })
        .label('Description'),
      nga
        .field('isavailable', 'boolean')
        .attributes({ placeholder: 'Is Available' })
        .validation({ required: true })
        .label('Is Available'),
      nga
        .field('pin_protected', 'boolean')
        .validation({ required: true })
        .label('Pin Protected'),

      nga
        .field('packages_channels', 'reference_many')
        .targetEntity(admin.getEntity('Packages'))
        .permanentFilters({ package_type_id: [1, 2] })
        .targetField(nga.field('package_name'))
        .label('Packages')
        .attributes({ placeholder: 'Select packages' })
        .singleApiCall(function(package_id) {
          return { 'package_id[]': package_id }
        }),

      nga
        .field('icon_url', 'file')
        .uploadInformation({
          url: '/file-upload/single-file/channels/icon_url',
          apifilename: 'result'
        })
        .template(
          '<div class="row">' +
            '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.icon_url }}" height="40" width="40" /></div>' +
            '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.icon_url"></ma-file-field></div>' +
            '</div>' +
            '<div class="row"><small id="emailHelp" class="form-text text-muted">240x240 px, not larger than 100 KB</small></div>'
        )
        .validation({
          validator: function(value) {
            if (value == null) {
              throw new Error('Please, choose icon')
            } else {
              var icon_url = document.getElementById('icon_url')
              if (icon_url.value.length > 0) {
                if (icon_url.files[0].size > 102400) {
                  throw new Error(
                    'Your Icon is too Big, not larger than 100 KB'
                  )
                }
              }
            }
          }
        })
        .label('Icon *'),
      nga
        .field('template')
        .label('')
        .template(edit_button)
    ])

  channels
    .editionView()
    .title(
      '<h4>Channels <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.title }}</h4>'
    )
    .actions([
      'list',
      '<ma-delete-button label="Remove" entry="entry" entity="entity"></ma-delete-button>'
    ])
    .fields([
      nga
        .field('title', 'string')
        .attributes({ placeholder: 'Channel name' })
        .validation({ required: true })
        .label('Title'),
      nga
        .field('epg_map_id', 'string')
        .template(
          '<ma-input-field field="field" value="entry.values.epg_map_id"></ma-input-field>' +
            '<small id="emailHelp" class="form-text text-muted">Identifier used to match epg files with the respective channel</small>'
        )
        .label('EPG MAP ID'),
      nga
        .field('channel_number', 'number')
        .attributes({ placeholder: 'Must be number' })
        .validation({ required: true })
        .label('Number'),
      nga
        .field('genre_id', 'reference')
        .targetEntity(admin.getEntity('Genres'))
        .targetField(nga.field('description'))
        .remoteComplete(true, {
          refreshDelay: 300,
          searchQuery: function (search) {
              return {q: search};
            }
        })
        .validation({
          validator: function(value) {
            if (value === null || value === '') {
              throw new Error('Please Select Genre')
            }
          }
        })
        .attributes({
          placeholder:
            'Choose from dropdown list one of the genres you already created'
        })
        
        .label('Genre *'),
      nga
        .field('description', 'text')
        .attributes({
          placeholder:
            'You can specify data you need to know for the channel in this field'
        })
        .validation({ required: true })
        .label('Description'),
      nga
        .field('isavailable', 'boolean')
        .attributes({ placeholder: 'Is Available' })
        .validation({ required: true })
        .label('Is Available'),
      nga
        .field('pin_protected', 'boolean')
        .validation({ required: true })
        .label('Pin Protected'),

      nga
        .field('packages_channels', 'reference_many')
        .targetEntity(admin.getEntity('Packages'))
        .permanentFilters({ package_type_id: [1, 2] })
        .targetField(nga.field('package_name'))
          .remoteComplete(true, {
              refreshDelay: 300,
              searchQuery: function (search) {
                return {q: search};
              }
            })
          .label('Packages')
        .attributes({ placeholder: 'Select packages' })
        .map(function getpckgid(value, entry) {
          var return_object = []
          for (var i = 0; i < value.length; i++) {
            return_object[i] = value[i].package_id
          }
          return return_object
        })
        .singleApiCall(function(package_id) {
          return { 'package_id[]': package_id }
        }),

      nga
        .field('icon_url', 'file')
        .uploadInformation({
          url: '/file-upload/single-file/channels/icon_url',
          apifilename: 'result'
        })
        .template(
          `<div class="row">
            <div class="col-xs-12 col-sm-1">
                <div ng-controller="modalController">
                  <img ng-src="{{ entry.values.icon_url }}"
                       alt="thumbnail"
                       width="45"
                       height="45"
                       ng-click="openModalImage(entry.values.icon_url, 'thumbnail')">
                </div> 
            </div>
            <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.icon_url"></ma-file-field></div>
            </div>
            <div class="row"><small id="emailHelp" class="form-text text-muted">240x240 px, not larger than 100 KB</small></div>`
        )
        .validation({
          validator: function(value) {
            if (value == null) {
              throw new Error('Please, choose icon')
            } else {
              var icon_url = document.getElementById('icon_url')
              if (icon_url.value.length > 0) {
                if (icon_url.files[0].size > 102400) {
                  throw new Error(
                    'Your Icon is too Big, not larger than 100 KB'
                  )
                }
              }
            }
          }
        })
        .label('Icon *'),
      nga
        .field('template')
        .label('')
        .template(edit_button),

      nga
        .field('ChannelStreams', 'referenced_list')
        .label('Channel Streams')
        .targetEntity(admin.getEntity('ChannelStreams'))
        .targetReferenceField('channel_id')
        .targetFields([
          nga
            .field('stream_url')
            // .map(function truncate(value) {
            // 	if (!value) {
            // 		return '';
            // 	}
            // 	return value.length > 25 ? value.substr(0, 25) + '...' : value;
            // })
            .label('Stream Url'),
          nga
            .field('stream_source_id', 'reference')
            .targetEntity(admin.getEntity('ChannelStreamSources'))
            .targetField(nga.field('stream_source'))
            .isDetailLink(false)
            .cssClasses('hidden-xs')
            .label('Stream Source'),
          nga
            .field('stream_format')
            .cssClasses('hidden-xs')
            .label('Stream Format'),
          nga.field('token', 'boolean').label('Token'),
          nga
            .field('encryption', 'boolean')
            .cssClasses('hidden-xs')
            .label('Encryption'),
          nga
            .field('stream_mode', 'string')
            .cssClasses('hidden-xs')
            .label('Stream Mode')
        ])
        .listActions(['edit', 'delete']),
      nga
        .field('template')
        .label('')
        .template(
          '<ma-create-button entity-name="ChannelStreams" class="pull-right" label="ADD STREAM" default-values="{ channel_id: entry.values.id }"></ma-create-button>'
        )
    ])

  return channels
}
