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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/core/Accessor", "esri/geometry", "esri/core/watchUtils"], function (require, exports, __extends, __decorate, decorators_1, Accessor, geometry_1, watchUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var IntegratedTitle = /** @class */ (function (_super) {
        __extends(IntegratedTitle, _super);
        function IntegratedTitle(obj) {
            return _super.call(this) || this;
        }
        IntegratedTitle.prototype.initialize = function () {
            var _this = this;
            this.view.watch(["camera", "size"], function () { return _this.update(); });
            this.viewport.watch("clippingArea", function () { return _this.update(); });
            this.update();
            this.element.classList.add("make-visible");
            watchUtils_1.whenOnce(this.view, "ready", function () { return _this.update(); });
        };
        IntegratedTitle.prototype.update = function () {
            if (!this.view.ready) {
                return;
            }
            var clip = this.view.clippingArea;
            var pt1 = new geometry_1.Point({ x: clip.xmin, y: clip.ymin, z: this.elevation, spatialReference: clip.spatialReference });
            var pt2 = new geometry_1.Point({ x: clip.xmax, y: clip.ymin, z: this.elevation, spatialReference: clip.spatialReference });
            var s1 = this.view.toScreen(pt1);
            var s2 = this.view.toScreen(pt2);
            var dx = -this.element.clientWidth / 2 + ((s1.x + s2.x) / 2);
            var dy = ((s1.y + s2.y) / 2);
            var heading = this.view.camera.heading;
            var ry = -(heading < 180 ? heading + 360 : heading);
            var translate = "translate(" + dx + "px, " + dy + "px)";
            var rotate = "rotateX(" + (90 - this.view.camera.tilt) + "deg) rotateY(" + (ry + 180) + "deg)";
            this.element.style.transform = translate + rotate;
        };
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], IntegratedTitle.prototype, "view", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], IntegratedTitle.prototype, "viewport", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], IntegratedTitle.prototype, "element", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], IntegratedTitle.prototype, "elevation", void 0);
        IntegratedTitle = __decorate([
            decorators_1.subclass()
        ], IntegratedTitle);
        return IntegratedTitle;
    }(decorators_1.declared(Accessor)));
    exports.IntegratedTitle = IntegratedTitle;
    exports.default = IntegratedTitle;
});
