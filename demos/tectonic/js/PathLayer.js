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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/Graphic", "esri/layers/GraphicsLayer", "esri/geometry", "esri/core/Collection", "esri/geometry/geometryEngine"], function (require, exports, __extends, __decorate, decorators_1, Graphic, GraphicsLayer, geometry_1, Collection, geometryEngine) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PolylineCollection = Collection.ofType(geometry_1.Polyline);
    var PathLayer = /** @class */ (function (_super) {
        __extends(PathLayer, _super);
        function PathLayer(obj) {
            var _this = _super.call(this) || this;
            _this.lines = new PolylineCollection();
            _this.height = 50;
            _this.updateId = 0;
            return _this;
        }
        Object.defineProperty(PathLayer.prototype, "clippingArea", {
            set: function (value) {
                this._set("clippingArea", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PathLayer.prototype, "symbol", {
            set: function (value) {
                this._set("symbol", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        PathLayer.prototype.initialize = function () {
            var _this = this;
            this.lines.on("change", function (ev) {
                _this.update();
            });
            this.elevationSampler.on("changed", function () { return _this.scheduleUpdate(); });
            this.update();
        };
        PathLayer.prototype.scheduleUpdate = function () {
            var _this = this;
            if (!this.updateId) {
                this.updateId = setTimeout(function () {
                    _this.updateId = 0;
                    _this.update();
                }, 0);
            }
        };
        PathLayer.prototype.update = function () {
            var _this = this;
            // Remove all graphics and recreate them.
            this.graphics.removeAll();
            this.lines.forEach(function (line) {
                var geometry = _this.createPathGeometry(line);
                var graphic = new Graphic({
                    geometry: geometry,
                    symbol: _this.symbol
                });
                _this.graphics.add(graphic);
            });
        };
        PathLayer.prototype.clipLine = function (line) {
            if (this.clippingArea) {
                var expandedClippingArea = this.clippingArea.clone().expand(1.1);
                return geometryEngine.clip(line, expandedClippingArea);
            }
            else {
                return line;
            }
        };
        PathLayer.prototype.densifyLine = function (line) {
            if (this.clippingArea) {
                var dim = Math.max(this.clippingArea.width, this.clippingArea.height);
                return geometryEngine.densify(line, dim / 50, "meters");
            }
            else {
                return line;
            }
        };
        PathLayer.prototype.createExtrudedPositionAttribute = function (line) {
            var path = line.paths[0];
            var position = new Float64Array(path.length * 2 * 3);
            var positionPtr = 0;
            for (var i = 0; i < path.length; i++) {
                position[positionPtr++] = path[i][0];
                position[positionPtr++] = path[i][1];
                position[positionPtr++] = path[i][2];
                position[positionPtr++] = path[i][0];
                position[positionPtr++] = path[i][1];
                position[positionPtr++] = path[i][2] + this.height;
            }
            return position;
        };
        PathLayer.prototype.createExtrudedMesh = function (line) {
            var position = this.createExtrudedPositionAttribute(line);
            var path = line.paths[0];
            var nSegments = path.length - 1;
            var faces = new Uint32Array(nSegments * 2 * 3);
            var facePtr = 0;
            var vertexPtr = 0;
            for (var i = 0; i < nSegments; i++) {
                faces[facePtr++] = vertexPtr;
                faces[facePtr++] = vertexPtr + 3;
                faces[facePtr++] = vertexPtr + 1;
                faces[facePtr++] = vertexPtr;
                faces[facePtr++] = vertexPtr + 2;
                faces[facePtr++] = vertexPtr + 3;
                vertexPtr += 2;
            }
            return new geometry_1.Mesh({
                vertexAttributes: {
                    position: position
                },
                components: [{
                        faces: faces
                    }],
                spatialReference: line.spatialReference
            });
        };
        PathLayer.prototype.createPathGeometry = function (line) {
            // Clip against clipping area using geometry engine
            var clipped = this.clipLine(line);
            // Create a simple "curtain" by densifying the line and extruding it up
            var densified = this.densifyLine(clipped);
            // Add elevation values from the elevation sampler
            var withElevation = this.elevationSampler.queryElevation(densified);
            var mesh = this.createExtrudedMesh(withElevation);
            return mesh;
        };
        __decorate([
            decorators_1.property()
        ], PathLayer.prototype, "clippingArea", null);
        __decorate([
            decorators_1.property({ constructOnly: true, type: PolylineCollection })
        ], PathLayer.prototype, "lines", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], PathLayer.prototype, "elevationSampler", void 0);
        __decorate([
            decorators_1.property()
        ], PathLayer.prototype, "symbol", null);
        __decorate([
            decorators_1.property()
        ], PathLayer.prototype, "height", void 0);
        PathLayer = __decorate([
            decorators_1.subclass()
        ], PathLayer);
        return PathLayer;
    }(decorators_1.declared(GraphicsLayer)));
    exports.PathLayer = PathLayer;
    exports.default = PathLayer;
});
