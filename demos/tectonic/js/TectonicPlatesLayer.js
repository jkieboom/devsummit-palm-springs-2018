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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/Collection", "esri/Graphic", "esri/geometry", "esri/core/accessorSupport/decorators", "esri/geometry/support/ImageMeshColor", "esri/layers/GraphicsLayer", "esri/tasks/QueryTask", "gl-matrix"], function (require, exports, __extends, __decorate, Collection, Graphic, geometry_1, decorators_1, ImageMeshColor, GraphicsLayer, QueryTask, gl_matrix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PolylineCollection = Collection.ofType(geometry_1.Polyline);
    var TectonicPlatesLayer = /** @class */ (function (_super) {
        __extends(TectonicPlatesLayer, _super);
        function TectonicPlatesLayer(obj) {
            var _this = _super.call(this) || this;
            _this.height = 50;
            _this.measurements = null;
            _this.texturePlate1 = new ImageMeshColor({
                url: "./img/TexturesCom_SoilRough0039_1_seamless_S.jpg"
            });
            _this.texturePlate2 = new ImageMeshColor({
                url: "./img/TexturesCom_SoilMud0004_1_seamless_S.jpg"
            });
            _this.textureEarth = new ImageMeshColor({
                url: "./img/TexturesCom_SandPebbles0060_1_seamless_S.jpg"
            });
            _this.updateId = 0;
            _this.meshSlicePlateHeight = 1000;
            _this.meshSliceHeight = 4000;
            return _this;
        }
        Object.defineProperty(TectonicPlatesLayer.prototype, "clippingArea", {
            set: function (value) {
                this._set("clippingArea", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TectonicPlatesLayer.prototype, "symbolBand", {
            set: function (value) {
                this._set("symbolBand", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TectonicPlatesLayer.prototype, "symbolEarth", {
            set: function (value) {
                this._set("symbolEarth", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        TectonicPlatesLayer.prototype.initialize = function () {
            var _this = this;
            this.elevationSampler.on("changed", function () { return _this.scheduleUpdate(); });
            this.fetchData();
        };
        TectonicPlatesLayer.prototype.fetchData = function () {
            return __awaiter(this, void 0, void 0, function () {
                var query, featureSet, measurements, i, feature, attr, start, end, location_1, velocity, previous;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            query = new QueryTask({
                                url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_steps/FeatureServer/0"
                            });
                            return [4 /*yield*/, query.execute({
                                    where: "PLATEBOUND = 'EU-IN'",
                                    returnGeometry: false,
                                    outFields: ["STARTLONG", "STARTLAT", "FINALLONG", "FINALLAT", "VELOCITYAZ", "VELOCITYDI", "VELOCITYRI", "AZIMUTHCEN"],
                                    orderByFields: ["SEQNUM"]
                                })];
                        case 1:
                            featureSet = _a.sent();
                            measurements = [];
                            for (i = 0; i < featureSet.features.length; i++) {
                                feature = featureSet.features[i];
                                attr = feature.attributes;
                                start = this.getStartLocation(feature);
                                end = this.getEndLocation(feature);
                                location_1 = new geometry_1.Point({
                                    x: (start.x + end.x) / 2,
                                    y: (start.y + end.y) / 2,
                                    spatialReference: start.spatialReference
                                });
                                velocity = this.calculateVelocity(feature);
                                if (measurements.length > 0) {
                                    previous = measurements[measurements.length - 1];
                                    measurements.push({ location: start, velocity: this.calculateVelocityBetween(previous.velocity, velocity) });
                                }
                                measurements.push({ location: location_1, velocity: velocity });
                            }
                            this.measurements = measurements;
                            this.update();
                            return [2 /*return*/];
                    }
                });
            });
        };
        TectonicPlatesLayer.prototype.getStartLocation = function (feature) {
            var attr = feature.attributes;
            var pt = new geometry_1.Point({ spatialReference: geometry_1.SpatialReference.WebMercator });
            pt.longitude = attr["STARTLONG"];
            pt.latitude = attr["STARTLAT"];
            return pt;
        };
        TectonicPlatesLayer.prototype.getEndLocation = function (feature) {
            var attr = feature.attributes;
            var pt = new geometry_1.Point({ spatialReference: geometry_1.SpatialReference.WebMercator });
            pt.longitude = attr["FINALLONG"];
            pt.latitude = attr["FINALLAT"];
            return pt;
        };
        TectonicPlatesLayer.prototype.calculateVelocityVector = function (v) {
            return [v.length * Math.cos(v.angle), v.length * Math.sin(v.angle)];
        };
        TectonicPlatesLayer.prototype.calculateVelocity = function (feature) {
            var attr = feature.attributes;
            var a1 = attr["AZIMUTHCEN"] / 180 * Math.PI;
            var a2 = attr["VELOCITYAZ"] / 180 * Math.PI;
            var v1 = [Math.cos(a1), Math.sin(a1)];
            var v2 = [Math.cos(a2), Math.sin(a2)];
            var d = v1[0] * v2[0] + v1[1] * v2[1];
            if (d < 0) {
                d = -d;
            }
            var dangle = Math.acos(d) / Math.PI * 180;
            var minAngle = 30;
            var maxAngle = 80;
            var angle = minAngle + (maxAngle - minAngle) * ((90 - dangle) / 90);
            var angleRad = angle / 180 * Math.PI;
            var l = Math.abs(attr["VELOCITYDI"]);
            return { length: l, angle: angleRad };
        };
        TectonicPlatesLayer.prototype.calculateVelocityBetween = function (v1, v2, f) {
            if (f === void 0) { f = 0.5; }
            return {
                length: this.lerp(v1.length, v2.length, f),
                angle: this.lerp(v1.angle, v2.angle, f)
            };
        };
        TectonicPlatesLayer.prototype.lerp = function (a, b, f) {
            return a + (b - a) * f;
        };
        TectonicPlatesLayer.prototype.scheduleUpdate = function () {
            var _this = this;
            if (!this.updateId) {
                this.updateId = setTimeout(function () {
                    _this.updateId = 0;
                    _this.update();
                }, 0);
            }
        };
        TectonicPlatesLayer.prototype.intersectLineLine = function (a, c, b, d) {
            var x = (d - c) / (a - b);
            return [x, a * x + c];
        };
        TectonicPlatesLayer.prototype.createMeshSlice = function (measurement, p, axis) {
            var velocity = measurement ? this.calculateVelocityVector(measurement.velocity) : [0, 0];
            // Interested in projection on X
            var velYZ = gl_matrix_1.vec2.fromValues(velocity[0], -velocity[1]);
            var norm = gl_matrix_1.vec2.normalize(gl_matrix_1.vec2.create(), velYZ);
            var nElevSamples = 50;
            var mx = measurement ? measurement.location.x : p;
            var my = measurement ? measurement.location.y : this.clippingArea.ymin;
            var z = 0;
            var ymin, ymax;
            if (axis === 0) {
                ymin = this.clippingArea.ymin;
                ymax = this.clippingArea.ymax;
            }
            else {
                ymin = this.clippingArea.xmin;
                ymax = this.clippingArea.xmax;
            }
            var l = gl_matrix_1.vec2.length(velYZ) * 100;
            var h = this.meshSlicePlateHeight;
            // y = a * x + b
            var pto = [my + norm[0] * h, z + -norm[1] * h];
            var a = norm[1] / norm[0];
            var c = pto[1] - a * pto[0];
            var cy1 = this.intersectLineLine(a, c, 0, z + h)[0];
            var cy2 = this.intersectLineLine(a, c, 0, z)[0];
            var dy = my + norm[0] * l;
            var dz = z + norm[1] * l;
            var zd = this.meshSliceHeight;
            var gap = 400;
            var position = [
                mx, ymin, z + h,
                mx, cy1, z + h,
                mx, cy1 + gap, z + h,
                mx, ymax, z + h,
                mx, ymin, z,
                mx, my, z,
                mx, cy2, z,
                mx, cy2 + gap, z,
                mx, ymax, z,
                mx, dy, dz,
                mx, dy - norm[1] * h, dz + norm[0] * h,
                mx, ymin, z - zd,
                mx, ymax, z - zd
            ];
            var pt = new geometry_1.Point({ spatialReference: this.clippingArea.spatialReference });
            for (var i = 0; i < nElevSamples; i++) {
                pt.x = mx;
                pt.y = i / (nElevSamples - 1) * (ymax - ymin) + ymin;
                if (axis === 1) {
                    _a = [pt.y, pt.x], pt.x = _a[0], pt.y = _a[1];
                }
                pt.z = this.elevationSampler.elevationAt(pt);
                if (axis === 1) {
                    _b = [pt.y, pt.x], pt.x = _b[0], pt.y = _b[1];
                }
                position.push(pt.x, pt.y, pt.z);
                position.push(pt.x, pt.y, z + h);
            }
            for (var i = 0; i < position.length; i += 3) {
                position[i + 1] = Math.min(Math.max(ymin, position[i + 1]), ymax);
            }
            var uv = [];
            var zmax = 8000;
            var zmin = z - zd;
            for (var i = 0; i < position.length; i += 3) {
                var u = (position[i + 1] - ymin) / (ymax - ymin);
                var v = (position[i + 2] - zmin) / (zmax - zmin);
                uv.push(u, v);
            }
            if (axis === 1) {
                // Swap x/y in vertex attributes
                for (var i = 0; i < position.length; i += 3) {
                    var x = position[i + 0];
                    var y = position[i + 1];
                    position[i + 0] = y;
                    position[i + 1] = x;
                }
            }
            var band = null;
            var earthFaces;
            if (measurement) {
                band = new geometry_1.Mesh({
                    vertexAttributes: {
                        position: position,
                        uv: uv
                    },
                    components: [
                        {
                            faces: [
                                0, 4, 1,
                                4, 5, 1,
                                5, 6, 1,
                                5, 9, 6,
                                6, 9, 10
                            ],
                            material: {
                                color: this.texturePlate1
                            }
                        },
                        {
                            faces: [
                                3, 7, 2,
                                3, 8, 7
                            ],
                            material: {
                                color: this.texturePlate2
                            }
                        }
                    ],
                    spatialReference: this.clippingArea.spatialReference
                });
                earthFaces = [
                    4, 5, 11,
                    5, 9, 11,
                    9, 12, 11,
                    10, 12, 9,
                    10, 8, 12,
                    7, 8, 10,
                    6, 7, 10,
                    2, 7, 6,
                    2, 6, 1
                ];
            }
            else {
                earthFaces = [
                    0, 3, 11,
                    11, 3, 12
                ];
            }
            var facePtr = 13;
            // Add top connecting to the surface
            for (var i = 0; i < nElevSamples - 1; i++) {
                earthFaces.push(facePtr, facePtr + 1, facePtr + 2);
                earthFaces.push(facePtr + 1, facePtr + 3, facePtr + 2);
                facePtr += 2;
            }
            var earth = new geometry_1.Mesh({
                vertexAttributes: {
                    position: position,
                    uv: uv
                },
                components: [
                    {
                        faces: earthFaces,
                        material: {
                            color: this.textureEarth
                        }
                    }
                ],
                spatialReference: this.clippingArea.spatialReference
            });
            return { band: band, earth: earth };
            var _a, _b;
        };
        TectonicPlatesLayer.prototype.update = function () {
            if (!this.measurements) {
                this.graphics.removeAll();
                return;
            }
            var currentGraphics = this.graphics.toArray();
            var nSlices = 2;
            var clip = this.clippingArea;
            for (var i = 0; i < nSlices; i++) {
                var dx = nSlices === 1 ? 0 : i / (nSlices - 1);
                var x = clip.xmin + dx * clip.width;
                // Figure out the position and velocity of a measurment that crosses
                // through this x coordinate
                var measurement = this.findMeasurementAt(x, clip.ymin, clip.ymax);
                // Generate mesh out of slice to represent the tectonic movement
                var sliceMeshes = this.createMeshSlice(measurement, x, 0);
                if (sliceMeshes.band) {
                    var graphic = new Graphic({
                        geometry: sliceMeshes.band,
                        symbol: this.symbolBand
                    });
                    this.graphics.add(graphic);
                }
                if (sliceMeshes.earth) {
                    var graphic = new Graphic({
                        geometry: sliceMeshes.earth,
                        symbol: this.symbolEarth
                    });
                    this.graphics.add(graphic);
                }
            }
            // Add meshes to close the box
            this.graphics.add(new Graphic({
                geometry: this.createMeshSlice(null, this.clippingArea.ymin, 1).earth,
                symbol: this.symbolEarth
            }));
            this.graphics.add(new Graphic({
                geometry: this.createMeshSlice(null, this.clippingArea.ymax, 1).earth,
                symbol: this.symbolEarth
            }));
            this.graphics.removeMany(currentGraphics);
        };
        TectonicPlatesLayer.prototype.findMeasurementAt = function (x, ymin, ymax) {
            for (var i = 1; i < this.measurements.length; i++) {
                var current = this.measurements[i];
                var previous = this.measurements[i - 1];
                var crossesX1 = previous.location.x <= x && current.location.x >= x;
                var crossesX2 = current.location.x <= x && previous.location.x >= x;
                var crossesY1 = previous.location.y <= ymax && current.location.y >= ymin;
                var crossesY2 = current.location.y <= ymax && previous.location.y >= ymin;
                if ((crossesX1 || crossesX2) && (crossesY1 || crossesY2)) {
                    var f = (x - previous.location.x) / (current.location.x - previous.location.x);
                    var y = previous.location.y + (current.location.y - previous.location.y) * f;
                    if (y < ymin || y > ymax) {
                        return null;
                    }
                    // Measurement is crossing the segment we want to visualize, return
                    // exact measurement
                    return {
                        location: new geometry_1.Point({ x: x, y: y, spatialReference: current.location.spatialReference }),
                        velocity: this.calculateVelocityBetween(previous.velocity, current.velocity, f)
                    };
                }
            }
            return null;
        };
        __decorate([
            decorators_1.property()
        ], TectonicPlatesLayer.prototype, "clippingArea", null);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], TectonicPlatesLayer.prototype, "elevationSampler", void 0);
        __decorate([
            decorators_1.property()
        ], TectonicPlatesLayer.prototype, "symbolBand", null);
        __decorate([
            decorators_1.property()
        ], TectonicPlatesLayer.prototype, "symbolEarth", null);
        __decorate([
            decorators_1.property()
        ], TectonicPlatesLayer.prototype, "height", void 0);
        TectonicPlatesLayer = __decorate([
            decorators_1.subclass()
        ], TectonicPlatesLayer);
        return TectonicPlatesLayer;
    }(decorators_1.declared(GraphicsLayer)));
    exports.TectonicPlatesLayer = TectonicPlatesLayer;
    exports.default = TectonicPlatesLayer;
});
