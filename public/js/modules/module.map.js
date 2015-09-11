define(
	'modules/module.map',
	[],
	function () {

		var MyBalloonLayout = ymaps.templateLayoutFactory.createClass(
			'<div class="baloon-custom top">' +
			'<span class="baloon-custom-close">X</span>' +
			'<div class="arrow"></div>' +
			'<div class="baloon-custom-inner">' +
			'$[[options.contentLayout observeSize minWidth=235 maxWidth=235 maxHeight=350]]' +
			'</div>' +
			'</div>', {

				build: function () {
					this.constructor.superclass.build.call(this);

					this._$element = $('.baloon-custom', this.getParentElement());

					this.applyElementOffset();

					this._$element.find('.baloon-custom-close')
						.on('click', $.proxy(this.onCloseClick, this));
				},

				clear: function () {
					this._$element.find('.baloon-custom-close')
						.off('click');

					this.constructor.superclass.clear.call(this);
				},

				onSublayoutSizeChange: function () {
					MyBalloonLayout.superclass.onSublayoutSizeChange.apply(this, arguments);

					if(!this._isElement(this._$element)) {
						return;
					}

					this.applyElementOffset();

					this.events.fire('shapechange');
				},

				applyElementOffset: function () {

					this._$element.css({
						left: -(this._$element[0].offsetWidth / 2),
						//left: -40,
						top: -(this._$element[0].offsetHeight + this._$element.find('.arrow')[0].offsetHeight +18)
					});
				},

				onCloseClick: function (e) {
					e.preventDefault();

					this.events.fire('userclose');
				},

				getShape: function () {
					if(!this._isElement(this._$element)) {
						return MyBalloonLayout.superclass.getShape.call(this);
					}

					var position = this._$element.position();

					return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([
						[position.left, position.top], [
							position.left + this._$element[0].offsetWidth,
							position.top + this._$element[0].offsetHeight + this._$element.find('.arrow')[0].offsetHeight
						]
					]));
				},


				_isElement: function (element) {
					return element && element[0] && element.find('.arrow')[0];
				}
			});
		var MyBalloonContentLayout = ymaps.templateLayoutFactory.createClass(
			'<div class="baloon-custom-content">$[properties.balloonContent]</div>'
		);
		var _private = {

			objects: {
				geoQueryList: null,
				objectManager: null,
				myMap: null,
				objectsWrap: null,
				hash: {
					center: false,
					zoom: false
				}
			},
			methods: {
				eventHandlers: function(){

					_private.objects.myMap.events.add('boundschange', function (e) {

						var objectsInmap = _private.objects.geoQueryList.searchInside(_private.objects.myMap);
						_private.methods.objectsShow(objectsInmap);

					}).add('boundschange', function (e) {

						_private.methods.setLocationHash();
					});
				},
				addToMap: function(dataObj, callback){

					var hashOpen = _private.methods.getParam('open');

					_private.objects.objectManager.removeAll();

					_private.objects.objectManager.add(dataObj);
					_private.objects.geoQueryList = ymaps.geoQuery(dataObj);

					if(_private.objects.baloon){

						ymaps.option.presetStorage.add('custom_point#icon',
							{
								iconImageHref: _private.objects.baloon.src,
								iconImageSize: _private.objects.baloon.size,
								iconImageOffset: _private.objects.baloon.offset,
								iconLayout: 'default#image'
							});

						_private.objects.objectManager.objects.options.set('preset', 'custom_point#icon');
					}

					if(_private.objects.cluster){

						_private.objects.objectManager.clusters.options.set({

							clusterIcons: [{
								href: _private.objects.cluster.src,
								size: _private.objects.cluster.size,
								offset: _private.objects.cluster.offset

							}]
						});
					}

					_private.objects.myMap.geoObjects.add(_private.objects.objectManager);

					if(_private.objects.customBaloon){

						_private.objects.objectManager.objects.options.set({
							balloonLayout: MyBalloonLayout,
							balloonContentLayout : MyBalloonContentLayout
						});
					}

					if(typeof callback == 'function'){
						callback(_private.objects.geoQueryList);
					}
				},
				applyBoundsToMapCity: function(objects){

					ymaps.geoQuery(objects).applyBoundsToMap(_private.objects.myMap, {
						zoomMargin: 10
					});
				},
				objectsShow: function(inmap) {

					if(typeof _private.methods.changeObject == 'function') {

						_private.methods.changeObject(inmap);
					}
				},
				setMapStateByHash: function(){

					if (_private.objects.hash.center) {

						_private.objects.myMap.setCenter(_private.objects.hash.center.split(','));
					}
					if (_private.objects.hash.zoom) {

						_private.objects.myMap.setZoom(_private.objects.hash.zoom);
					}

				},
				setLocationHash: function() {

					var params = [
						'center=' + _private.objects.myMap.getCenter(),
						'zoom=' + _private.objects.myMap.getZoom()
					];

					window.location.hash = params.join('&');
				},
				getParam: function(name, location) {

					location = location || window.location.hash;
					var res = location.match(new RegExp('[#&]' + name + '=([^&]*)', 'i'));
					return (res && res[1] ? res[1] : false);
				}
			},
			props: {}
		};

		var _public = {
			init: function (args) {

				var callAfterAdd;

				//_private.objects.wrap = args.wrap;
				_private.objects.baloon = args.baloon || false;
				_private.objects.cluster = args.cluster || false;
				_private.methods.changeObject = args.changeObject || false;
				_private.objects.customBaloon = args.customBaloon || false;

				_private.objects.objectManager = new ymaps.ObjectManager({
					clusterize: true
				});

				_private.objects.myMap = new ymaps.Map(args.wrap, {
					center: [59.91815364, 30.30557800],
					zoom: 12,
					// controls: []
					controls: ["zoomControl"]

				}, {
					maxZoom: 18,
					minZoom: 8
				});

				callAfterAdd = function(objects){

					_private.methods.applyBoundsToMapCity(objects);
					_private.methods.objectsShow(objects);
				};

				if(location.hash){

					_private.objects.hash.center = _private.methods.getParam('center');
					_private.objects.hash.zoom = _private.methods.getParam('zoom');

					_private.methods.setMapStateByHash();

					if(_private.objects.hash.center || _private.objects.hash.zoom) callAfterAdd = function(objects){};
				}
				_private.methods.addToMap(args.data, callAfterAdd);
				_private.methods.eventHandlers();
			},
			updateDate: function(data){

				_private.methods.addToMap(data);
			},
			applyBoundsMap: function(){

				_private.methods.applyBoundsToMapCity(_private.objects.geoQueryList);
			}
		};

		return _public;
	}
);