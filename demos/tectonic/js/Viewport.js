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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/geometry", "esri/core/Accessor", "esri/core/accessorSupport/decorators"], function (require, exports, __extends, __decorate, geometry_1, Accessor, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Represents the viewport of the slice of surface that we want to view.
     * The viewport computes a clipping area based on the center of the
     * viewport and a fixed size.
     */
    var Viewport = /** @class */ (function (_super) {
        __extends(Viewport, _super);
        function Viewport() {
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            var _this = _super !== null && _super.apply(this, arguments) || this;
            //----------------------------------
            //  size
            //----------------------------------
            _this.size = 20000;
            //----------------------------------
            //  center
            //----------------------------------
            _this.center = new geometry_1.Point({
                x: 9745688.759045323,
                y: 3118756.1269532256,
                spatialReference: geometry_1.SpatialReference.WebMercator
            });
            return _this;
        }
        Object.defineProperty(Viewport.prototype, "clippingArea", {
            //----------------------------------
            //  clippingArea
            //----------------------------------
            get: function () {
                var halfSize = this.size / 2;
                var center = this.center;
                return new geometry_1.Extent({
                    xmin: center.x - halfSize,
                    xmax: center.x + halfSize,
                    ymin: center.y - halfSize,
                    ymax: center.y + halfSize,
                    spatialReference: geometry_1.SpatialReference.WebMercator
                });
            },
            enumerable: true,
            configurable: true
        });
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Applies an offset to the center of the viewport.
         *
         * @param x the x offset.
         * @param y the y offset.
         */
        Viewport.prototype.offset = function (dx, dy) {
            var _a = this.center, x = _a.x, y = _a.y, spatialReference = _a.spatialReference;
            this.center = new geometry_1.Point({ x: x + dx, y: y + dy, spatialReference: spatialReference });
        };
        __decorate([
            decorators_1.property()
        ], Viewport.prototype, "size", void 0);
        __decorate([
            decorators_1.property()
        ], Viewport.prototype, "center", void 0);
        __decorate([
            decorators_1.property({ dependsOn: ["size", "center"], readOnly: true })
        ], Viewport.prototype, "clippingArea", null);
        Viewport = __decorate([
            decorators_1.subclass()
        ], Viewport);
        return Viewport;
    }(decorators_1.declared(Accessor)));
    exports.Viewport = Viewport;
    exports.default = Viewport;
});
