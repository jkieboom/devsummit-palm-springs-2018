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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/Accessor", "esri/core/watchUtils", "esri/core/accessorSupport/decorators"], function (require, exports, __extends, __decorate, Accessor, watchUtils_1, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A DOM element that is positioned in 3D by tracking
     * a point on the viewport.
     */
    var DOMElement3D = /** @class */ (function (_super) {
        __extends(DOMElement3D, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function DOMElement3D(obj) {
            return _super.call(this) || this;
        }
        DOMElement3D.prototype.initialize = function () {
            var _this = this;
            this.view.watch(["camera", "size"], function () { return _this.update(); });
            this.update();
            watchUtils_1.whenOnce(this.view, "ready", function () { return _this.update(); });
        };
        Object.defineProperty(DOMElement3D.prototype, "location", {
            //----------------------------------
            //  location
            //----------------------------------
            set: function (value) {
                this._set("location", value);
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DOMElement3D.prototype, "heading", {
            set: function (value) {
                this._set("heading", value);
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
         * Updates the position and orientation of the DOM element. This is
         * called whenever the view or the clipping area has changed.
         */
        DOMElement3D.prototype.update = function () {
            if (!this.view.ready || !this.location) {
                return;
            }
            if (!this.element.classList.contains("make-visible")) {
                this.element.classList.add("make-visible");
            }
            var screenLocation = this.view.toScreen(this.location);
            // Figure out the absolute translation to position the bottom center
            // of the element in between s1 and s2
            var translationX = -this.element.clientWidth / 2 + screenLocation.x;
            var translationY = screenLocation.y - this.element.clientHeight;
            // Figure out the rotation based on the heading and tilt of the camera
            var heading = this.view.camera.heading - this.heading;
            // Heading translates to rotation around the Y axis. Since we are positioning
            // the element on the ymin plane of the clipping area, we add 180 degrees
            // to the camera heading. We also have to rotate in the opposite direction
            // as the camera heading since the element is facing the camera.
            var rotationY = -(heading < 180 ? heading + 360 : heading);
            // Tilt translates to rotation around the X axis, 90deg camera tilt means
            // 0 degree CSS rotation, so that the element is standing up from the surface
            var rotationX = 90 - this.view.camera.tilt;
            var translate = "translate(" + translationX + "px, " + translationY + "px)";
            var rotate = "rotateX(" + rotationX + "deg) rotateY(" + rotationY + "deg)";
            this.element.style.transform = translate + " " + rotate;
        };
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], DOMElement3D.prototype, "view", void 0);
        __decorate([
            decorators_1.property()
        ], DOMElement3D.prototype, "location", null);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], DOMElement3D.prototype, "element", void 0);
        __decorate([
            decorators_1.property({ value: 0 })
        ], DOMElement3D.prototype, "heading", null);
        DOMElement3D = __decorate([
            decorators_1.subclass()
        ], DOMElement3D);
        return DOMElement3D;
    }(decorators_1.declared(Accessor)));
    exports.DOMElement3D = DOMElement3D;
    exports.default = DOMElement3D;
});
