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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/Graphic", "esri/geometry", "esri/core/Collection", "esri/core/accessorSupport/decorators", "esri/geometry/geometryEngine", "esri/layers/GraphicsLayer"], function (require, exports, __extends, __decorate, Graphic, geometry_1, Collection, decorators_1, geometryEngine, GraphicsLayer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PolylineCollection = Collection.ofType(geometry_1.Polyline);
    /**
     *
     */
    var PlateBoundaryLayer = /** @class */ (function (_super) {
        __extends(PlateBoundaryLayer, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function PlateBoundaryLayer(obj) {
            var _this = _super.call(this) || this;
            //----------------------------------
            // lines
            //----------------------------------
            _this.lines = new PolylineCollection();
            //----------------------------------
            //  height
            //----------------------------------
            _this.height = 50;
            //--------------------------------------------------------------------------
            //
            //  Variables
            //
            //--------------------------------------------------------------------------
            _this.updateId = 0;
            return _this;
        }
        PlateBoundaryLayer.prototype.initialize = function () {
            var _this = this;
            this.lines.on("change", function (ev) {
                _this.update();
            });
            this.elevationSampler.on("changed", function () { return _this.scheduleUpdate(); });
            this.update();
        };
        Object.defineProperty(PlateBoundaryLayer.prototype, "clippingArea", {
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  clippingArea
            //----------------------------------
            set: function (value) {
                this._set("clippingArea", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlateBoundaryLayer.prototype, "symbol", {
            //----------------------------------
            //  symbol
            //----------------------------------
            set: function (value) {
                this._set("symbol", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Schedules an update in the next frame.
         */
        PlateBoundaryLayer.prototype.scheduleUpdate = function () {
            var _this = this;
            if (!this.updateId) {
                this.updateId = setTimeout(function () {
                    _this.updateId = 0;
                    _this.update();
                }, 0);
            }
        };
        /**
         * Creates a mesh geometry that follows the line representing
         * a plate boundary. The line is clipped to the clipping area,
         * densified, enriched with z-values from the ground surface
         * and then tesselated to create the mesh.
         *
         * @param line the line.
         */
        PlateBoundaryLayer.prototype.createPathGeometry = function (line) {
            // Clip against clipping area using geometry engine
            var clipped = this.clipLine(line);
            // Create a simple "curtain" by densifying the line and extruding it up
            var densified = this.densifyLine(clipped);
            // Add elevation values from the elevation sampler
            var withElevation = this.elevationSampler.queryElevation(densified);
            var mesh = this.createExtrudedMesh(withElevation);
            return mesh;
        };
        /**
         * Clips a line against the clipping area.
         *
         * @param line the line to clip.
         */
        PlateBoundaryLayer.prototype.clipLine = function (line) {
            if (this.clippingArea) {
                var expandedClippingArea = this.clippingArea.clone().expand(1.1);
                return geometryEngine.clip(line, expandedClippingArea);
            }
            else {
                return line;
            }
        };
        /**
         * Densifies a line such that there are approximately
         * 50 segments covering the clipping area size.
         *
         * @param line the line to densify.
         */
        PlateBoundaryLayer.prototype.densifyLine = function (line) {
            if (this.clippingArea) {
                var dim = Math.max(this.clippingArea.width, this.clippingArea.height);
                return geometryEngine.densify(line, dim / 50, "meters");
            }
            else {
                return line;
            }
        };
        /**
         * Create the extruded vertex position attribute for
         * a given line. The line is expected to have z-values
         * that coincide with the ground surface. The line is
         * extruded upwards by [height](#height).
         *
         * @param line the line.
         */
        PlateBoundaryLayer.prototype.createExtrudedPositionAttribute = function (line) {
            // NOTE: we only take the first path. Multi-path lines
            // are currently not supported (but the below can be
            // easily adapted if so needed).
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
        /**
         * Create an extruded mesh geometry along the line. This method
         * assumes the line has z-values that coincide with the ground
         * surface.
         *
         * @param line the line.
         */
        PlateBoundaryLayer.prototype.createExtrudedMesh = function (line) {
            var position = this.createExtrudedPositionAttribute(line);
            var path = line.paths[0];
            var nSegments = path.length - 1;
            var faces = new Uint32Array(nSegments * 2 * 3);
            var facePtr = 0;
            var vertexPtr = 0;
            // Create two triangle faces between each consecutive
            // pair of vertices in the line.
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
        /**
         * Updates the geometry when elevation or the clipping area has
         * changed.
         */
        PlateBoundaryLayer.prototype.update = function () {
            var _this = this;
            this.graphics.removeAll();
            // Create a path geometry for plate boundary
            var graphics = this.lines.map(function (line) {
                var geometry = _this.createPathGeometry(line);
                return new Graphic({
                    geometry: geometry,
                    symbol: _this.symbol
                });
            });
            this.graphics.addMany(graphics);
        };
        __decorate([
            decorators_1.property()
        ], PlateBoundaryLayer.prototype, "clippingArea", null);
        __decorate([
            decorators_1.property({ constructOnly: true, type: PolylineCollection })
        ], PlateBoundaryLayer.prototype, "lines", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], PlateBoundaryLayer.prototype, "elevationSampler", void 0);
        __decorate([
            decorators_1.property()
        ], PlateBoundaryLayer.prototype, "symbol", null);
        __decorate([
            decorators_1.property()
        ], PlateBoundaryLayer.prototype, "height", void 0);
        PlateBoundaryLayer = __decorate([
            decorators_1.subclass()
        ], PlateBoundaryLayer);
        return PlateBoundaryLayer;
    }(decorators_1.declared(GraphicsLayer)));
    exports.PlateBoundaryLayer = PlateBoundaryLayer;
    exports.default = PlateBoundaryLayer;
});
