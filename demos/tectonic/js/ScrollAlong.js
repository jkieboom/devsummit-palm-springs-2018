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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/geometry", "esri/core/Accessor", "esri/core/accessorSupport/decorators", "./CatmullRom", "gl-matrix"], function (require, exports, __extends, __decorate, geometry_1, Accessor, decorators_1, CatmullRom_1, gl_matrix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ScrollAlong = /** @class */ (function (_super) {
        __extends(ScrollAlong, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function ScrollAlong(obj) {
            var _this = _super.call(this) || this;
            _this.positionOnPath = 0.6513702167390425;
            _this.userHeadingDelta = 16.22429524083836;
            _this.playIntervalId = 0;
            return _this;
        }
        ScrollAlong.prototype.initialize = function () {
            var _this = this;
            this.view.on("mouse-wheel", function (ev) { return _this.onMouseWheel(ev); });
            this.view.on("hold", function (ev) { return _this.onHold(ev); });
            this.viewport.watch("clippingArea", function () { return _this.updateViewCamera(); });
            var path = this.path.paths[0];
            this.interpolatedPath = new CatmullRom_1.CatmullRom({ points: path });
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Handle a mouse wheel event by updating the viewport so that
         * we scroll through a slice of the terrain, following the
         * provided path.
         *
         * @param ev mouse wheel event.
         */
        ScrollAlong.prototype.onMouseWheel = function (ev) {
            // Allow by-passing of scroll hijack by Ctrl key
            if (ev.native.ctrlKey) {
                return;
            }
            var moveVelocity = 0.0001;
            this.moveAlongPath(ev.deltaY * moveVelocity);
            // Avoid regular navigation (zoom) from mouse wheel.
            ev.stopPropagation();
        };
        /**
         * Move the viewport along the path by the provided delta.
         *
         * @param delta normalized path delta (from 0 to 1)
         */
        ScrollAlong.prototype.moveAlongPath = function (delta) {
            // Calculate the desired heading along the path
            var pathHeading = this.calculatePathHeading(this.positionOnPath);
            // Store the delta between the desired and current heading
            // so we preserve heading offset caused by user interaction
            var userHeadingDelta = this.view.camera.heading - pathHeading;
            // Update userHeadingDelta with a threshold to avoid drifting
            // caused by numerical errors.
            if (Math.abs(userHeadingDelta - this.userHeadingDelta) > 1) {
                this.userHeadingDelta = userHeadingDelta;
            }
            // Update positionOnPath (between - and 1)
            var newPosition = this.positionOnPath + delta;
            this.positionOnPath = Math.min(Math.max(0, newPosition), 1);
            // Evaluate the interpolated path
            var center = this.interpolatedPath.evaluateAt(this.positionOnPath);
            // Update the viewport center with the new center
            this.viewport.center = new geometry_1.Point({
                x: center[0],
                y: center[1],
                spatialReference: this.path.spatialReference
            });
        };
        /**
         * Calculates the heading of the path at the provided position
         * by taking a three point average of the path.
         *
         * @param t the position on the path.
         */
        ScrollAlong.prototype.calculatePathHeading = function (t) {
            // Three point average heading at the interpolated path
            var p0 = this.interpolatedPath.evaluateAt(t - 0.001);
            var p1 = this.interpolatedPath.evaluateAt(t);
            var p2 = this.interpolatedPath.evaluateAt(t + 0.001);
            var h1 = this.computeHeading(p0, p1);
            var h2 = this.computeHeading(p1, p2);
            return (h1 + h2) / 2;
        };
        // Compute heading from a vector specified by two points
        ScrollAlong.prototype.computeHeading = function (pt1, pt2) {
            var dir = gl_matrix_1.vec2.normalize(gl_matrix_1.vec2.create(), gl_matrix_1.vec2.subtract(gl_matrix_1.vec2.create(), pt2, pt1));
            var heading = Math.atan2(dir[0], dir[1]);
            // Convert to degrees
            return heading / Math.PI * 180;
        };
        /**
         * Update the view camera when the clipping area changes. This
         * updates both the view clipping area from the viewport clipping area,
         * and the camera to center on the new clipping area and preserve
         * the heading along the path.
         */
        ScrollAlong.prototype.updateViewCamera = function () {
            var heading = this.calculatePathHeading(this.positionOnPath) + this.userHeadingDelta;
            this.view.clippingArea = this.viewport.clippingArea;
            var center = this.viewport.clippingArea.center.clone();
            center.z = 1500;
            this.view.goTo({
                target: center,
                scale: 171502,
                heading: heading
            }, { animate: false });
        };
        ScrollAlong.prototype.onHold = function (ev) {
            var _this = this;
            if (this.playIntervalId) {
                clearInterval(this.playIntervalId);
                this.playIntervalId = 0;
            }
            else {
                this.playIntervalId = setInterval(function () {
                    _this.moveAlongPath(0.0001);
                }, 10);
            }
            ev.stopPropagation();
        };
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], ScrollAlong.prototype, "view", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], ScrollAlong.prototype, "viewport", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], ScrollAlong.prototype, "path", void 0);
        ScrollAlong = __decorate([
            decorators_1.subclass()
        ], ScrollAlong);
        return ScrollAlong;
    }(decorators_1.declared(Accessor)));
    exports.ScrollAlong = ScrollAlong;
    exports.default = ScrollAlong;
});
