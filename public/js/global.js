requirejs.config({
	"baseUrl": "/js",
	"paths": {
		"jquery": "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min"
	}
});

$(function () {
	$.getJSON('/map.json', function (response) {
		var objectWrap = $('.objects-wrap');

		if (response) {
			ymaps.ready(function () {
				requirejs(
					['modules/module.map', 'jquery'],
					function (Map, $, yaMaps) {

						//var myMap = new Map();

						Map.init({
							wrap: 'map',
							data: response,
							baloon: {
								src: '/img/baloon.png',
								size: [76, 72],
								offset: [-29, -72]
							},
							customBaloon: true,
							cluster: {
								src: '/img/cluster-icon.png',
								size: [66, 66],
								offset: [-33, -33]
							},
							changeObject: function (objects) {

								var list = $('<ul/>', {class: "objects-wrap__list"});

								objectWrap.html('');

								objects.each(function(object) {

									var li = $('<li/>', {class: "objects-wrap__item"});

									li.text(object.properties.get('name'));
									list.append(li);
								});
								objectWrap.append(list);
							}
						});

					}
				);
			});
		}
	});
});