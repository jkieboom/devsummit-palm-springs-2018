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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/Map", "esri/core/watchUtils", "esri/core/Accessor", "esri/core/accessorSupport/decorators", "esri/layers/TileLayer", "esri/layers/FeatureLayer", "esri/layers/ElevationLayer", "esri/renderers/SimpleRenderer", "esri/symbols/FillSymbol3DLayer", "esri/symbols/MeshSymbol3D", "esri/symbols/edges/SolidEdges3D", "esri/symbols/edges/SketchEdges3D", "esri/views/SceneView", "./BlendLayer", "./Viewport", "./LavaRenderer", "./TectonicPlatesLayer", "./PlateBoundaryLayer", "./ExaggerationElevationLayer"], function (require, exports, __extends, __decorate, Map, watchUtils, Accessor, decorators_1, TileLayer, FeatureLayer, ElevationLayer, SimpleRenderer, FillSymbol3DLayer, MeshSymbol3D, SolidEdges3D, SketchEdges3D, SceneView, BlendLayer_1, Viewport_1, LavaRenderer_1, TectonicPlatesLayer_1, PlateBoundaryLayer_1, ExaggerationElevationLayer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var View = /** @class */ (function (_super) {
        __extends(View, _super);
        function View() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        View.prototype.initialize = function () {
            this._set("viewport", new Viewport_1.Viewport());
            this.createView();
            this.createPlateBoundaryLayer();
            // Step 5: tectonic plates subdiction
            //
            this.createTectonicPlatesLayer();
            // Step 7: finishing touches
            //
            this.createLavaRenderer();
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        View.prototype.createPlateBoundaryLayer = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Step 4: Elevation profile along boundary
                        //
                        // await this.createPlateBoundaryLayerSimple();
                        return [4 /*yield*/, this.createPlateBoundaryLayerProfile()];
                        case 1:
                            // Step 4: Elevation profile along boundary
                            //
                            // await this.createPlateBoundaryLayerSimple();
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        View.prototype.createPlateBoundaryLayerSimple = function () {
            return __awaiter(this, void 0, void 0, function () {
                var renderer, layer;
                return __generator(this, function (_a) {
                    renderer = new SimpleRenderer({
                        symbol: {
                            type: "line-3d",
                            symbolLayers: [
                                {
                                    type: "line",
                                    size: 5,
                                    material: {
                                        color: [100, 255, 255, 0.5]
                                    }
                                }
                            ]
                        }
                    });
                    layer = new FeatureLayer({
                        url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0",
                        definitionExpression: "Name = 'EU-IN'",
                        renderer: renderer
                    });
                    this.view.map.add(layer);
                    return [2 /*return*/];
                });
            });
        };
        View.prototype.createPlateBoundaryLayerProfile = function () {
            return __awaiter(this, void 0, void 0, function () {
                var symbol, clippingArea, elevationSampler, layer, ret;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, watchUtils.whenOnce(this.view, "groundView.elevationSampler")];
                        case 1:
                            _a.sent();
                            symbol = new MeshSymbol3D({
                                symbolLayers: [
                                    new FillSymbol3DLayer({
                                        material: {
                                            color: [100, 255, 255, 0.5]
                                        },
                                        edges: new SolidEdges3D({
                                            color: "white",
                                            size: "3px"
                                        })
                                    })
                                ]
                            });
                            clippingArea = this.view.clippingArea;
                            elevationSampler = this.view.groundView.elevationSampler;
                            layer = new PlateBoundaryLayer_1.PlateBoundaryLayer({
                                clippingArea: clippingArea,
                                symbol: symbol,
                                elevationSampler: elevationSampler,
                                height: 1000,
                                lines: [this.tectonicPlateBoundaryLine]
                            });
                            this.view.map.add(layer);
                            // Make sure the clipping area synchronizes from the view to the layer
                            this.syncClippingArea(layer);
                            return [4 /*yield*/, this.view.whenLayerView(layer).then(function (layerView) { return ({ layerView: layerView }); })];
                        case 2:
                            ret = _a.sent();
                            ret.layerView.updateClippingExtent = function () { return true; };
                            return [2 /*return*/];
                    }
                });
            });
        };
        View.prototype.syncClippingArea = function (layer) {
            this.view.watch("clippingArea", function (clippingArea) {
                layer.clippingArea = clippingArea;
            });
        };
        // Create a local view with the provided map and clipping area
        View.prototype.createView = function () {
            var map = this.createMap();
            var view = new SceneView({
                container: "viewDiv",
                map: map,
                viewingMode: "local",
                camera: {
                    position: { x: 87.22524752, y: 27.18392724, z: 26046.80071 },
                    heading: 127.73,
                    tilt: 61.54
                },
                clippingArea: this.viewport.clippingArea,
                ui: {
                    components: ["attribution"]
                }
            });
            this._set("view", view);
        };
        // Create the basic map with custom layers that improve perception
        // of mountains and ridges:
        //
        // 1. A basmap containing a custom layer that blends
        //    hill shading on top of satellite imagery
        // 2. A ground containing a custom elevation layer that exaggerates
        //    elevation
        View.prototype.createMap = function () {
            var hillShadeLayer = new TileLayer({
                url: "https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer"
            });
            var baseImageLayer = new TileLayer({
                url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
            });
            var worldElevationLayer = new ElevationLayer({
                url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
            });
            return new Map({
                basemap: {
                    baseLayers: [
                        new BlendLayer_1.BlendLayer({
                            // multiplyLayers: [ baseImageLayer ]
                            multiplyLayers: [baseImageLayer, hillShadeLayer]
                        })
                    ]
                },
                ground: {
                    layers: [
                        new ExaggerationElevationLayer_1.ExaggerationElevationLayer({
                            // exaggerationFactor: 1,
                            exaggerationFactor: 2,
                            elevationLayer: worldElevationLayer
                        })
                    ]
                }
            });
        };
        View.prototype.createTectonicPlatesLayer = function () {
            return __awaiter(this, void 0, void 0, function () {
                var symbolBand, symbolEarth, clippingArea, elevationSampler, layer, ret;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, watchUtils.whenOnce(this.view, "groundView.elevationSampler")];
                        case 1:
                            _a.sent();
                            symbolBand = new MeshSymbol3D({
                                symbolLayers: [
                                    new FillSymbol3DLayer({
                                        edges: new SketchEdges3D({ size: "1px", extensionLength: "5px" })
                                    })
                                ]
                            });
                            symbolEarth = new MeshSymbol3D({
                                symbolLayers: [
                                    new FillSymbol3DLayer({
                                        material: {
                                            color: "white"
                                        }
                                    })
                                ]
                            });
                            clippingArea = this.view.clippingArea;
                            elevationSampler = this.view.groundView.elevationSampler;
                            layer = new TectonicPlatesLayer_1.TectonicPlatesLayer({
                                clippingArea: clippingArea,
                                symbolBand: symbolBand,
                                symbolEarth: symbolEarth,
                                elevationSampler: elevationSampler
                            });
                            this.view.map.add(layer);
                            return [4 /*yield*/, this.view.whenLayerView(layer).then(function (layerView) { return ({ layerView: layerView }); })];
                        case 2:
                            ret = _a.sent();
                            ret.layerView.updateClippingExtent = function () { return true; };
                            // Make sure the clipping area synchronizes from the view to the layer
                            this.syncClippingArea(layer);
                            return [2 /*return*/];
                    }
                });
            });
        };
        View.prototype.createLavaRenderer = function () {
            var _this = this;
            this.lavaRenderer = new LavaRenderer_1.LavaRenderer({ view: this.view, top: -4000, bottom: -8000 });
            // Add ability to pause/resume the lava animation with pressing Space
            this.view.on("key-down", function (ev) {
                if (ev.key === " ") {
                    _this.lavaRenderer.playing = !_this.lavaRenderer.playing;
                }
            });
        };
        __decorate([
            decorators_1.property({ readOnly: true })
        ], View.prototype, "view", void 0);
        __decorate([
            decorators_1.property({ readOnly: true })
        ], View.prototype, "viewport", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], View.prototype, "tectonicPlateBoundaryLine", void 0);
        __decorate([
            decorators_1.property({ readOnly: true })
        ], View.prototype, "hillShadeLayer", void 0);
        View = __decorate([
            decorators_1.subclass()
        ], View);
        return View;
    }(decorators_1.declared(Accessor)));
    exports.View = View;
    exports.default = View;
});
