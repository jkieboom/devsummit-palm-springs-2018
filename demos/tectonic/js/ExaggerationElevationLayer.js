/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />
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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/tsSupport/generatorHelper", "esri/core/tsSupport/awaiterHelper", "esri/core/accessorSupport/decorators", "esri/layers/BaseElevationLayer"], function (require, exports, __extends, __decorate, __generator, __awaiter, decorators_1, BaseElevationLayer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An elevation layer that exaggerates a source elevation layer
     * by multiplying elevation values by a constant.
     */
    var ExaggerationElevationLayer = /** @class */ (function (_super) {
        __extends(ExaggerationElevationLayer, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function ExaggerationElevationLayer(obj) {
            return _super.call(this) || this;
        }
        //--------------------------------------------------------------------------
        //
        //  Public methods
        //
        //--------------------------------------------------------------------------
        ExaggerationElevationLayer.prototype.load = function () {
            // wait for the elevation layer to load before resolving load()
            this.addResolvingPromise(this.elevationLayer.load());
            return;
        };
        /**
         * Fetches a single tile. This method is simply a wrapper around
         * the actual implementation that uses async/await.
         *
         * @param level the tile level.
         * @param row the tile row.
         * @param col the tile column.
         */
        ExaggerationElevationLayer.prototype.fetchTile = function (level, row, col) {
            return this._fetchTile(level, row, col);
        };
        //--------------------------------------------------------------------------
        //
        //  Private methods
        //
        //--------------------------------------------------------------------------
        /**
         * Fetches the tile at the specified level/row/col. The tile will
         * be composed of the tile from the underlying elevation layer,
         * with values exaggerated with the exaggeration factor.
         *
         * @param level the tile level.
         * @param row the tile row.
         * @param col the tile column.
         */
        ExaggerationElevationLayer.prototype._fetchTile = function (level, row, col) {
            return __awaiter(this, void 0, void 0, function () {
                var data, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.elevationLayer.fetchTile(level, row, col)];
                        case 1:
                            data = _a.sent();
                            for (i = 0; i < data.values.length; i++) {
                                data.values[i] *= this.exaggerationFactor;
                            }
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], ExaggerationElevationLayer.prototype, "elevationLayer", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], ExaggerationElevationLayer.prototype, "exaggerationFactor", void 0);
        ExaggerationElevationLayer = __decorate([
            decorators_1.subclass()
        ], ExaggerationElevationLayer);
        return ExaggerationElevationLayer;
    }(decorators_1.declared(BaseElevationLayer)));
    exports.ExaggerationElevationLayer = ExaggerationElevationLayer;
    exports.default = ExaggerationElevationLayer;
});
