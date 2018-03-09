/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/Map", "esri/core/watchUtils", "esri/core/Accessor", "esri/core/accessorSupport/decorators", "esri/layers/FeatureLayer", "esri/renderers/SimpleRenderer", "esri/views/MapView"], function (require, exports, __extends, __decorate, Map, watchUtils, Accessor, decorators_1, FeatureLayer, SimpleRenderer, MapView) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Overview = /** @class */ (function (_super) {
        __extends(Overview, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function Overview(obj) {
            return _super.call(this) || this;
        }
        Overview.prototype.initialize = function () {
            var map = this.createMap();
            this._set("view", this.createView(map, this.viewport));
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        Overview.prototype.createMap = function () {
            var map = new Map({
                basemap: "topo-vector"
            });
            var renderer = new SimpleRenderer({
                symbol: {
                    type: "simple-line",
                    width: "5px",
                    color: [100, 255, 255, 0.5]
                }
            });
            var layer = new FeatureLayer({
                url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0",
                definitionExpression: "Name = 'EU-IN'",
                renderer: renderer
            });
            map.add(layer);
            return map;
        };
        Overview.prototype.createView = function (map, viewport) {
            var view = new MapView({
                container: "overviewDiv",
                map: map,
                ui: { components: [] }
            });
            view.when(function () {
                // Synchronize the view to the viewport clipping area
                watchUtils.init(viewport, "clippingArea", function () {
                    view.goTo({
                        target: viewport.clippingArea.center,
                        scale: 3000000
                    });
                });
            });
        };
        __decorate([
            decorators_1.property({ readOnly: true })
        ], Overview.prototype, "view", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], Overview.prototype, "viewport", void 0);
        Overview = __decorate([
            decorators_1.subclass()
        ], Overview);
        return Overview;
    }(decorators_1.declared(Accessor)));
    exports.Overview = Overview;
});
