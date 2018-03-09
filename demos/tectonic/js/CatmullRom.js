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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/Accessor", "esri/core/accessorSupport/decorators"], function (require, exports, __extends, __decorate, Accessor, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Implements catmull rom piecewise interpolation of a given
     * set of points. The resulting interpolation is normalized between
     * 0 and 1 where each segment is proportional to its relative
     * euclidean length.
     */
    var CatmullRom = /** @class */ (function (_super) {
        __extends(CatmullRom, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function CatmullRom(obj) {
            return _super.call(this) || this;
        }
        CatmullRom.prototype.initialize = function () {
            this.computeSegments();
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        CatmullRom.prototype.evaluateAt = function (t) {
            for (var _i = 0, _a = this.segments; _i < _a.length; _i++) {
                var segment = _a[_i];
                if (t <= segment.end) {
                    var trel = (t - segment.start) / (segment.end - segment.start);
                    return this.evaluateSegment(segment, trel);
                }
            }
            return null;
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Evaluates the coefficients that belong to a segment to interpolate
         * between its two end-points.
         *
         * @param segment the segment to evaluate.
         * @param t the position at which to evaluate (0 to 1)
         */
        CatmullRom.prototype.evaluateSegment = function (segment, t) {
            var _this = this;
            return segment.coefficients.map(function (coefficients) { return _this.evaluateCoefficients(coefficients, t); });
        };
        /**
         * Evaluates the Catmull Rom coefficients.
         *
         * @param coefficients the coefficients.
         * @param t the position at which to evaluate (0 to 1)
         */
        CatmullRom.prototype.evaluateCoefficients = function (coefficients, t) {
            var t2 = t * t;
            var t3 = t2 * t;
            return t3 * coefficients[0] + t2 * coefficients[1] + t * coefficients[2] + coefficients[3];
        };
        /**
         * Computes piecewise interpolated segments by calculating
         * Catmull Rom coefficients between each consequtive point.
         */
        CatmullRom.prototype.computeSegments = function () {
            var totalLength = 0;
            var segments = [];
            // Ignore start/end, generate coefficients for all segments in between
            for (var i = 1; i < this.points.length - 2; i++) {
                var p0 = this.points[i - 1];
                var p1 = this.points[i];
                var p2 = this.points[i + 1];
                var p3 = this.points[i + 2];
                var length_1 = this.dist(p1, p2);
                var coefficients = this.computeCoefficients(p0, p1, p2, p3);
                segments.push({ start: totalLength, end: totalLength + length_1, coefficients: coefficients });
                totalLength += length_1;
            }
            for (var _i = 0, segments_1 = segments; _i < segments_1.length; _i++) {
                var segment = segments_1[_i];
                segment.start /= totalLength;
                segment.end /= totalLength;
            }
            this.segments = segments;
        };
        /**
         * Calculates the euclidean distance between two points
         * of the same dimension.
         *
         * @param p1 the first point.
         * @param p2 the second point.
         */
        CatmullRom.prototype.dist = function (p1, p2) {
            var s = 0;
            for (var i = 0; i < p1.length; i++) {
                var d = p1[i] - p2[i];
                s += d * d;
            }
            return Math.sqrt(s);
        };
        /**
         * Computes the Catmull Rom coefficients for a multi-dimensional point.
         * This will simply calculate the coefficients for each dimension
         * separately (@see [computeCoefficients1D](#computeCoefficients1D)).
         *
         * @param p0 the first point.
         * @param p1 the second point.
         * @param p2 the third point.
         * @param p3 the fourth point.
         */
        CatmullRom.prototype.computeCoefficients = function (p0, p1, p2, p3) {
            var coefficients = [];
            for (var i = 0; i < p0.length; i++) {
                var coefficient = this.computeCoefficient1D(p0[i], p1[i], p2[i], p3[i]);
                coefficients.push(coefficient);
            }
            return coefficients;
        };
        /**
         * Calculates the Catmull Rom coefficients between
         * p1 and p2. The resulting coefficients can be interpolated
         * between 0 and 1 to interpolate between p1 and p2.
         *
         * @param p0 the first coordinate.
         * @param p1 the second coordinate.
         * @param p2 the third coordinate.
         * @param p3 the fourth coordinate.
         */
        CatmullRom.prototype.computeCoefficient1D = function (p0, p1, p2, p3) {
            var a = -p0 + 3 * p1 - 3 * p2 + p3;
            var b = 2 * p0 - 5 * p1 + 4 * p2 - p3;
            var c = p2 - p0;
            var d = 2 * p1;
            return [0.5 * a, 0.5 * b, 0.5 * c, 0.5 * d];
        };
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], CatmullRom.prototype, "points", void 0);
        CatmullRom = __decorate([
            decorators_1.subclass()
        ], CatmullRom);
        return CatmullRom;
    }(decorators_1.declared(Accessor)));
    exports.CatmullRom = CatmullRom;
    exports.default = CatmullRom;
});
