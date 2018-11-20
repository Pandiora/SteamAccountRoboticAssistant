/* 

ToDo: Maybe load this file as json - this way it doesn't needs to get evaluated
currently it is better to leave it as it is, because the file is better readable
on the other hand, using eval to read this file should be avoided

*/
db_scheme = {
	steam_users: `[
		{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
		{ field: "type", headerText: chrome.i18n.getMessage("index_table_typ"), width: 100, editType: ej.Grid.EditingType.Dropdown, dataSource: [{"text" : "Smurf", "value" : "Smurf"}, {"text" : "Master", "value" : "Master"}], validationRules: { required: true }  },
		{ field: "login_name", headerText: chrome.i18n.getMessage("index_table_login_name"), width: 150, validationRules: { required: true }  },
		{ field: "login_pw",
			headerText: chrome.i18n.getMessage("index_table_login_pw"),
			width: 150,
			validationRules: { required: true },
			cssClass: "passwordColumn",
			editTemplate: {
				create: function (){ return '<input>'; },
				read: function (args) { return args.ejMaskEdit("get_UnstrippedValue"); },
				write: function (args) {
					args.element.ejMaskEdit({
						value: args.rowdata["login_pw"]
					});
				}
			}
		},
		{ field: "username", headerText: chrome.i18n.getMessage("index_table_username"), width: 150 },
		{ field: "email", headerText: chrome.i18n.getMessage("index_table_email"), width: 250 },
		{ field: "steam_id", headerText: chrome.i18n.getMessage("index_table_steamid"), width: 150, validationRules: { required: true, range: [70000000000000000, 79999999999999999] }  },
		{ field: "level", headerText: chrome.i18n.getMessage("index_table_lvl"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
		{ field: "active", headerText: chrome.i18n.getMessage("index_table_act"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
		{ field: "verified", headerText: chrome.i18n.getMessage("index_table_verified"), width: 85, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
		{ field: "csgo", headerText: chrome.i18n.getMessage("index_table_csgo"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 5] } },
		{ field: "community", headerText: chrome.i18n.getMessage("index_table_com"), width: 100, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 5] } },
		{ field: "purchased", headerText: chrome.i18n.getMessage("index_table_purchased"), textAlign: ej.TextAlign.Center, width: 100, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
		{ field: "group", headerText: chrome.i18n.getMessage("index_table_group"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
		{ field: "friend", headerText: chrome.i18n.getMessage("index_table_friend"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
		{ field: "public", headerText: chrome.i18n.getMessage("index_table_public"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
		{ field: "skip", headerText: chrome.i18n.getMessage("index_table_skip"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
		{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
		{ field: "steamMachine", headerText: chrome.i18n.getMessage("index_table_cookie"), width: 320 },
		{ field: "apikey", headerText: chrome.i18n.getMessage("index_table_api"), width: 260 },
		{ field: "revocation_code", headerText: chrome.i18n.getMessage("index_table_rcode"), width: 85, validationRules: { minlength: 6, maxlength: 6 } },
		{ field: "shared_secret", headerText: chrome.i18n.getMessage("index_table_shared"), width: 250 },
		{ field: "identity_secret", headerText: chrome.i18n.getMessage("index_table_identity"), width: 250 },
		{ field: "device_id", headerText: chrome.i18n.getMessage("index_table_device"), width: 400 },
	]`,
	steam_users_toolbar_btn: `[
		{ templateID: ".Refresh-Button" },
		{ templateID: ".ExportJSON-Button" },
		{ templateID: ".ImportJSON-Button" },
		{ templateID: ".ClearTable-Button" },
		{ templateID: ".GetBadgesAndLevel"}
	]`,
	users_games: `[
		{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
		{ field: "username", headerText: chrome.i18n.getMessage("index_table_username"), width: 150 },
		{ field: "steam_id", headerText: chrome.i18n.getMessage("index_table_steamid"), width: 150, validationRules: { required: true, range: [70000000000000000, 79999999999999999] }  },
		{ field: "app_id", headerText: chrome.i18n.getMessage("index_table_appid"), width: 150 },
		{ field: "game_name", headerText: chrome.i18n.getMessage("index_table_game"), width: 150 },
		{ field: "product_key", headerText: chrome.i18n.getMessage("index_table_product_key"), width: 150 },
		{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
		{ field: "added", headerText: chrome.i18n.getMessage("index_table_added"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
	]`,
	users_games_toolbar_btn: `[
		{ templateID: ".Refresh-Button" },
		{ templateID: ".ExportJSON-Button" },
		{ templateID: ".ImportJSON-Button" },
		{ templateID: ".ClearTable-Button" },
		{ templateID: ".GetDataOfOwnedGames" }
	]`,
	users_badges: `[
		{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
		{ field: "username", headerText: chrome.i18n.getMessage("index_table_username"), width: 150 },
		{ field: "steam_id", headerText: chrome.i18n.getMessage("index_table_steamid"), width: 150, validationRules: { required: true, range: [70000000000000000, 79999999999999999] }  },
		{ field: "app_id", headerText: chrome.i18n.getMessage("index_table_appid"), width: 150 },
		{ field: "game_name", headerText: chrome.i18n.getMessage("index_table_game"), width: 150 },
		{ field: "max_lvl", headerText: chrome.i18n.getMessage("index_table_maxlevel"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
		{ field: "cur_lvl", headerText: chrome.i18n.getMessage("index_table_curlevel"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },				
		{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
		{ field: "crafted", headerText: chrome.i18n.getMessage("index_table_crafted"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
	]`,
	users_badges_toolbar_btn: `[
		{ templateID: ".Refresh-Button" },
		{ templateID: ".ExportJSON-Button" },
		{ templateID: ".ImportJSON-Button" },
		{ templateID: ".ClearTable-Button" },
		{ templateID: ".GetBadgesForUser" }
	]`,
	steam_badges: `[
		{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
		{ field: "app_id", headerText: chrome.i18n.getMessage("index_table_appid"), width: 150 },
		{ field: "game_name", headerText: chrome.i18n.getMessage("index_table_game"), width: 150 },
		{ field: "cards_total", headerText: chrome.i18n.getMessage("index_table_cards"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
		{ field: "max_lvl", headerText: chrome.i18n.getMessage("index_table_maxlevel"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
		{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
	]`,
	steam_badges_toolbar_btn: `[
		{ templateID: ".Refresh-Button" },
		{ templateID: ".ExportJSON-Button" },
		{ templateID: ".ImportJSON-Button" },
		{ templateID: ".ClearTable-Button" },
		{ templateID: ".GetAllGamesWithBadges" }
	]`,
	sara_settings: `[
		{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
		{ field: "keyname", headerText: chrome.i18n.getMessage("index_table_keyname"), width: 150 },
		{ field: "val1", headerText: "val1", width: 150 },
		{ field: "val2", headerText: "val2", width: 150 },
		{ field: "description", headerText: chrome.i18n.getMessage("index_table_desc"), width: 550 },
		{ field: "val3", headerText: "val3", width: 150 },
		{ field: "val4", headerText: "val4", width: 150 },
		{ field: "val5", headerText: "val5", width: 150 },
		{ field: "val6", headerText: "val6", width: 150 },
		{ field: "val7", headerText: "val7", width: 150 },
		{ field: "val8", headerText: "val8", width: 150 },
		{ field: "val9", headerText: "val9", width: 150 },
		{ field: "val10", headerText: "val10", width: 150 },
	]`,
	sara_settings_toolbar_btn: `[
		{ templateID: ".Refresh-Button" },
		{ templateID: ".ExportJSON-Button" },
		{ templateID: ".ImportJSON-Button" },
		{ templateID: ".ClearTable-Button" }
	]`
};