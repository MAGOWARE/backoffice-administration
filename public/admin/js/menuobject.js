export default [

    //======================================Dashboard (access: admin,finance,sales,cc)=================================
    {
        "template":'<div class="menu_space">Dashboard</div>',
        "group_roles":["admin","finance","sales","cc"],
        "children": []
    },

    {
        "title":"Dashboard",
        "icon":'<span class="fa fa-tachometer fa-fw dashboard_icon"></span>',
        "group_roles":["admin","finance"],
        "children": [],
        "link":'/dashboard'
    },

    {
        "title":"New Customer",
        "icon":'<span class="fa fa-user-plus fa-fw dashboard_icon"></span>',
        "group_roles":["admin","sales","cc"],
        "children": [],
        "link":'/CustomerAccount/create'
    },

    {
        "title":"New Sale",
        "icon":'<span class="fa fa-plus fa-fw dashboard_icon"></span>',
        "group_roles":["admin","sales","cc"],
        "children": [],
        "link":'/Subscriptions/create'
    },


    //======================================Customer Management (access: superadmin, admin , cc, marketing)=================================
    {
        "template":'<div class="menu_space">Customer Management</div>',
        "group_roles":["superadmin","admin","cc",'marketing'],
        "children": []
    },

    {
        "title":"Customers",
        "icon":'<span class="fa fa-user-circle fa-fw dashboard_icon"></span>',
        "group_roles":["admin","cc"],
        "children": [],
        "link":'/CustomerAccount/list'
    },

    {
        "title":"Devices",
        "icon":'<span class="fa fa-table fa-fw dashboard_icon"></span>',
        "group_roles":["admin","cc"],
        "children": [],
        "link":'/Devices/list'
    },

    {
        "title":"System Users",
        "icon":'<span class="fa fa-users fa-fw dashboard_icon"></span>',
        "group_roles":["superadmin"],
        "children": [{
            "entity":"Groups",
            "title":"User Groups",
            "icon":'<span class="fa fa-users fa-fw dashboard_icon"></span>',
            "link":'/Groups/list',
            "group_roles":["superadmin"]
        },{
            "entity":"Users",
            "title":"Users",
            "icon":'<span class="fa fa-user fa-fw dashboard_icon"></span>',
            "link":'/Users/list',
            "group_roles":["superadmin"]
        }]
    },

    {
        "title":"Remote Control",
        "icon":'<span class="fa fa-terminal fa-fw dashboard_icon"></span>',
        "group_roles":["admin","cc"],
        "children": [],
        "link":'/commands/list'
    },

    {
        "title":"Payment Logs",
        "icon":'<span class="fa fa-book fa-fw dashboard_icon"></span>',
        "group_roles":["admin","cc"],
        "children": [],
        "link":'/PaymentTransactions/list'
    },

    {
        "title":"Notifications",
        "icon":'<span class="fa fa-users fa-fw dashboard_icon"></span>',
        "group_roles":["admin","cc","marketing"],
        "children": [{
            "entity":"",
            "title":"Information Message",
            "icon":'<span class="fa fa-bell fa-fw dashboard_icon"></span>',
            "link":'/messages/list',
            "group_roles":["admin","cc","marketing"]
        },{
            "entity":"",
            "title":"Banners",
            "icon":'<span class="fa fa-buysellads fa-fw dashboard_icon"></span>',
            "link":'/ads/list',
            "group_roles":["admin","cc","marketing"]
        }]
    },

    //======================================Reports (access: admin, finance)===================================================
    {
        "template":'<div class="menu_space">Reports</div>',
        "group_roles":["admin","finance"],
        "children": []
    },

    {
        "title":"Subscription",
        "icon":'<span class="fa fa-calendar-check-o fa-fw dashboard_icon"></span>',
        "group_roles":["admin","finance"],
        "children": [],
        "link":'/Subscriptions/list'
    },

    {
        "title":"Sales Reports",
        "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
        "group_roles":["admin","finance"],
        "children":
            [
                {
                    "entity":"Salesreports",
                    "title":"Salesreports",
                    "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                    "link":'/Salesreports/list',
                    "group_roles":["admin","finance"]
                },{
                "entity":"sales_by_product",
                "title":"Product Sales",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/sales_by_product/list',
                "group_roles":["admin","finance"]
            },{
                "entity":"sales_by_date",
                "title":"Sales By Day",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/sales_by_date/list',
                "group_roles":["admin","finance"]
            },{
                "entity":"sales_by_month",
                "title":"Sales By Month",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/sales_by_month/list',
                "group_roles":["admin","finance"]
            },{
                "entity":"sales_monthly_expiration",
                "title":"Account Expiration By Month",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/sales_monthly_expiration/list',
                "group_roles":["admin","finance"]
            },{
                "entity":"sales_by_expiration",
                "title":"Expirations List",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/sales_by_expiration/list',
                "group_roles":["admin","finance"]
            },{
                "entity":"",
                "title":"Expiration Next 30 Days",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/sales_by_expiration/list?search=%7B%22next%22:%2230%22%7D',
                "group_roles":["admin","finance"]
            },
            {
                "entity":"",
                "title":"Expiration Graph",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/expiresubscription',
                "group_roles":["admin","finance"]
            }
            ]
    },

    //======================================Video Content Management (access: admin , content_management)=======================
    {
        "template":'<div class="menu_space">Video Content Management</div>',
        "group_roles":["admin","content_management"],
        "children": []
    },

    {
        "title":"Live TV Channels",
        "icon":'<span class="fa fa-television fa-fw dashboard_icon"></span>',
        "group_roles":["admin","content_management"],
        "children": [

            {
                "entity":"",
                "title":"Categories / Genre",
                "icon":'<span class="fa fa-folder-open fa-fw dashboard_icon"></span>',
                "link":'/Genres/list',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Channels and Streams",
                "icon":'<span class="fa fa-play-circle fa-fw dashboard_icon"></span>',
                "link":'/Channels/list',
                "group_roles":["admin","content_management"]
            },
            {
                "entity":"Channels",
                "title":"Not Active Channels",
                "icon":'<span class="fa fa-times-circle-o fa-fw dashboard_icon"></span>',
                "link":'/Channels/list?search=%7B"isavailable":false%7D',
                "group_roles":["admin","content_management"]
            }
        ]
    },

    {
        "title":"VOD Content",
        "icon":'<span class="fa fa-film fa-fw dashboard_icon"></span>',
        "group_roles":["admin","content_management"],
        "children": [

            {
                "entity":"",
                "title":"Categories / Genre",
                "icon":'<span class="fa fa-folder-open fa-fw dashboard_icon"></span>',
                "link":'/VodCategories/list',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Videos and Streams",
                "icon":'<span class="fa fa-play-circle fa-fw dashboard_icon"></span>',
                "link":'/Vods/list?search=%7B"pin_protected":"0"%7D',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"VOD Menu",
                "icon":'<span class="fa fa-film fa-fw dashboard_icon"></span>',
                "link":'/vodMenu/list',
                "group_roles":["admin","content_management"]
            },
        ]
    },

    {
        "title":"TV Shows",
        "icon":'<span class="fa fa-film fa-fw dashboard_icon"></span>',
        "group_roles":["admin","content_management"],
        "children": [

            {
                "entity":"",
                "title":"Categories / Genre",
                "icon":'<span class="fa fa-folder-open fa-fw dashboard_icon"></span>',
                "link":'/VodCategories/list',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Serials",
                "icon":'<span class="fa fa-video-camera fa-fw dashboard_icon"></span>',
                "link":'/Series/list',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Seasons",
                "icon":'<span class="fa fa-video-camera fa-fw dashboard_icon"></span>',
                "link":'/Season/list',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Episodes",
                "icon":'<span class="fa fa-video-camera fa-fw dashboard_icon"></span>',
                "link":'/VodEpisode/list',
                "group_roles":["admin","content_management"]
            }
        ]
    },

    {
        "title":"EPG Data",
        "icon":'<span class="fa fa-map-o fa-fw dashboard_icon"></span>',
        "group_roles":["admin","content_management"],
        "children": [

            {
                "entity":"",
                "title":"List",
                "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
                "link":'/EpgData/list',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Graph",
                "icon":'<span class="fa fa-bar-chart fa-fw dashboard_icon"></span>',
                "link":'/epggraph',
                "group_roles":["admin","content_management"]
            }
        ]
    },

    {
        "title":"Import Data",
        "icon":'<span class="fa fa-download fa-fw dashboard_icon"></span>',
        "group_roles":["admin","content_management"],
        "children": [

            {
                "entity":"",
                "title":"EPG Import",
                "icon":'<span class="fa fa-map-o fa-fw dashboard_icon"></span>',
                "link":'/epgimport/create',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Live TV Channels in CSV, M3U",
                "icon":'<span class="fa fa-file fa-fw dashboard_icon"></span>',
                "link":'/import_channel/create',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"VOD in CSV",
                "icon":'<span class="fa fa-file fa-fw dashboard_icon"></span>',
                "link":'/import_vod/create',
                "group_roles":["admin","content_management"]
            },

            //hidden for the moment (meaning: import several movies at the same time)
            // {
            //     "entity":"",
            //     "title":"VOD lists",
            //     "icon":'<span class="fa fa-film fa-fw"></span>',
            //     "link":'/Vods/list?search=%7B"pin_protected":"0"%7D',
            //     "group_roles":["admin","content_management"]
            // },

            {
                "entity":"",
                "title":"Import Movies From TMDB",
                "icon":'<span class="fa fa-file-video-o  fa-fw dashboard_icon"></span>',
                "link":'/tmdbvods/list?search=%7B"q":"titanic"%7D',
                "group_roles":["admin","content_management"]
            },

            {
                "entity":"",
                "title":"Import TV Shows from TMDB",
                "icon":'<span class="fa fa-file-video-o  fa-fw dashboard_icon"></span>',
                "link":'/tmdbseries/list?search=%7B"q":"Stranger%20Things"%7D',
                "group_roles":["admin","content_management"]
            }
        ]
    },

    //======================================Settings (access: superadmin, admin, IT)=======================================================

    {
        "template":'<div class="menu_space">Settings</div>',
        "group_roles":["superadmin","admin","audit","IT","marketing"],
        "children": []
    },

    {
        "title": "Company Settings",
        "icon": '<span class="fa fa-cog fa-fw dashboard_icon"></span>',
        "group_roles": ["superadmin"],
        "children": [{
            "entity": "company_settings",
            "title": "Company Settings",
            "icon": '<span class="fa fa-envelope-o fa-fw dashboard_icon"></span>',
            "link": '/company_settings/list',
            "group_roles": ["superadmin"]
        }]
    },

    {
        "title": "Plans And Packages",
        "icon":'<span class="fa fa-tags fa-fw dashboard_icon"></span>',
        "group_roles":["admin","marketing"],
        "children": [
            {
                "entity": "",
                "title": "Plans",
                "icon":'<span class="fa fa-tags fa-fw dashboard_icon"></span>',
                "link":'/Combos/list',
                "group_roles":["admin","marketing"]
            },
            {
                "entity": "",
                "title": "Live TV Packages",
                "icon":'<span class="fa fa-th fa-fw dashboard_icon"></span>',
                "link":'/livepackages/list',
                "group_roles":["admin","marketing"]
            },
            {
                "entity": "",
                "title": "VOD Packages",
                "icon":'<span class="fa fa-th fa-fw dashboard_icon"></span>',
                "link":'/vodPackages/list',
                "group_roles":["admin","marketing"]
            }
        ]
    },

    {
        "title":"System Configuration",
        "icon":'<span class="fa fa-cog fa-fw dashboard_icon"></span>',
        "group_roles":["admin","IT"],
        "children": [{
            "entity":"EmailSettings",
            "title":"Email Settings",
            "icon":'<span class="fa fa-envelope-o fa-fw dashboard_icon"></span>',
            "link":'/EmailSettings/edit/1',
            "group_roles":["admin","IT"]
        },{
            "entity":"PlayerSettings",
            "title":"Player Settings",
            "icon":'<span class="fa fa-play fa-fw dashboard_icon"></span>',
            "link":'/PlayerSettings/edit/1',
            "group_roles":["admin","IT"]
        },{
            "entity":"URL",
            "title":"URLs",
            "icon":'<span class="fa fa-link fa-fw dashboard_icon"></span>',
            "link":'/URL/edit/1',
            "group_roles":["admin","IT"]
        },{
            "entity":"ApiKeys",
            "title":"Api Keys",
            "icon":'<span class="fa fa-key fa-fw dashboard_icon"></span>',
            "link":'/ApiKeys/edit/1',
            "group_roles":["admin","IT"]
        },{
            "title":"API Parameters",
            "icon":'<span class="fa fa-cog fa-fw dashboard_icon"></span>',
            "group_roles":["admin","IT"],
            "children": [],
            "link":'/AdvancedSettings/list'
        },
            {
                "title":"GeoIP",
                "icon":'<span class="fa fa-globe fa-fw dashboard_icon"></span>',
                "group_roles":["admin","IT"],
                "children": [],
                "link":'/geoip'
            },
            {
                "entity":"Settings",
                "title":"Other",
                "icon":'<span class="fa fa-cog fa-fw dashboard_icon"></span>',
                "link":'/Settings/edit/1',
                "group_roles":["admin","IT"]
            }]
    },

    {
        "title": "Appearence / Branding",
        "icon":'<span class="fa fa-align-justify fa-fw dashboard_icon"></span>',
        "group_roles":["admin","marketing"],
        "children": [
            {
                "title":"Main Menu",
                "icon":'<span class="fa fa-align-justify fa-fw dashboard_icon"></span>',
                "group_roles":["admin","marketing"],
                "children": [],
                "link":'/DeviceMenus/list'
            },
            {
                "title":"Logos and Images",
                "icon":'<span class="fa fa-picture-o fa-fw dashboard_icon"></span>',
                "group_roles":["admin","marketing"],
                "children": [],
                "link":'/ImagesSettings/edit/1'
            },
            {
                "title":"HTML Content",
                "icon":'<span class="fa fa-code fa-fw dashboard_icon"></span>',
                "group_roles":["admin","marketing"],
                "children": [],
                "link":'/htmlContent/list'
            },
            {
                "title":"Email Templates",
                "icon":'<span class="fa fa-envelope fa-fw dashboard_icon"></span>',
                "group_roles":["admin","marketing"],
                "children": [],
                "link":'/EmailTemplate/list'
            }
        ]
    },

    {
        "title": "Stream Sources",
        "icon":'<span class="fa fa-signal fa-fw dashboard_icon"></span>',
        "group_roles":["admin","IT"],
        "children": [
            {
                "title":"Live TV Stream Sources",
                "icon":'<span class="fa fa-signal fa-fw dashboard_icon"></span>',
                "group_roles":["admin","IT"],
                "children": [],
                "link":'/ChannelStreamSources/list'
            },
            {
                "title":"VOD Stream Sources",
                "icon":'<span class="fa fa-signal fa-fw dashboard_icon"></span>',
                "group_roles":["admin","IT"],
                "children": [],
                "link":'/VodStreamSources/list'
            }
        ]
    },

    {
        "title":"Users and Roles",
        "icon":'<span class="fa fa-users fa-fw dashboard_icon"></span>',
        "group_roles":["admin","IT"],
        "children": [],
        "link":'/Users/list'
    },

    {
        "title":"Sales Agents",
        "icon":'<span class="fa fa-user fa-fw dashboard_icon"></span>',
        "group_roles":["admin","IT"],
        "children": [],
        "link":'/Users/list?search=%7B"group_id":6%7D'
    },

    {
        "title": "System Info",
        "icon":'<span class="fa fa-info fa-fw dashboard_icon"></span>',
        "group_roles":["admin","audit","IT"],
        "children": [
            {
                "title":"Customer Group",
                "icon":'<span class="fa fa-users fa-fw dashboard_icon"></span>',
                "group_roles":["admin","audit","IT"],
                "children": [],
                "link":'/CustomerGroups/list'
            },
            {
                "title":"App Management",
                "icon":'<span class="fa fa-upload fa-fw dashboard_icon"></span>',
                "group_roles":["admin","audit","IT"],
                "children": [],
                "link":'/appmanagement/list'
            },
            {
                "title":"APP Group",
                "icon":'<span class="fa fa-file fa-fw dashboard_icon"></span>',
                "link":'/appgroup/list',
                "group_roles":["admin","audit","IT"],
                "children": []
            },
            {
                "title":"Audit Logs",
                "icon":'<span class="fa fa-book fa-fw dashboard_icon"></span>',
                "group_roles":["admin","audit","IT"],
                "children": [],
                "link":'/logs/list'
            },
            {
                "title":"Server Status",
                "icon":'<span class="fa fa-server fa-fw dashboard_icon"></span>',
                "group_roles":["admin","audit","IT"],
                "children": [],
                "link":'/serverStatus'
            }
        ]
    },

    {
        "title":"Support",
        "icon":'<span class="fa fa-question fa-fw dashboard_icon"></span>',
        "group_roles":["superadmin","admin","audit","IT"],
        "children": [],
        "link":'/support'
    },

//======================================================================================================================
//                                         RESELLERS DASHBOARD
//======================================================================================================================
    {
        "title":"My Dashboard",
        "icon":'<span class="fa fa-tachometer fa-fw dashboard_icon"></span>',
        "group_roles":["resellers"],
        "children": [],
        "link":'/dashboard'
    },
    {
        "title":"Search Customers",
        "icon":'<span class="fa fa-search fa-fw dashboard_icon"></span>',
        "group_roles":["resellers"],
        "children": [],
        "link":'/search_customer/list'
    },
    {
        "title":"Add Subscription",
        "icon":'<span class="fa fa-calendar-check-o fa-fw dashboard_icon"></span>',
        "group_roles":["resellers"],
        "children": [],
        "link":'/MySubscription/create'
    },
    {
        "title":"Add New Customer",
        "icon":'<span class="fa fa-users fa-fw dashboard_icon"></span>',
        "group_roles":["resellers"],
        "children": [],
        "link":'/NewCustomer/create'
    },
    {
        "title":"My Sales",
        "icon":'<span class="fa fa-list fa-fw dashboard_icon"></span>',
        "group_roles":["resellers"],
        "children": [],
        "link":'/MySales/list?search=%7B"distributorname":"'+localStorage.userName+'"%7D'
    }
];