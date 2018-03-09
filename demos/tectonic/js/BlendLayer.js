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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/tsSupport/generatorHelper", "esri/core/tsSupport/awaiterHelper", "esri/core/accessorSupport/decorators", "esri/layers/BaseTileLayer"], function (require, exports, __extends, __decorate, __generator, __awaiter, decorators_1, BaseTileLayer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Tile layer that blends multiple tile layers together using
     * a multiply operation. This is particularly useful to combine
     * a mask layer (such as a hillshade layer) with a basemap
     * layer (such as satellite imagery or a topographic layer).
     */
    var BlendLayer = /** @class */ (function (_super) {
        __extends(BlendLayer, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function BlendLayer(obj) {
            return _super.call(this) || this;
        }
        BlendLayer.prototype.initialize = function () {
            var _this = this;
            this.multiplyLayers.forEach(function (layer) {
                layer.watch("visible", function () { return _this.refresh(); });
            });
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        BlendLayer.prototype.load = function () {
            for (var _i = 0, _a = this.multiplyLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                this.addResolvingPromise(layer.load());
            }
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
        BlendLayer.prototype.fetchTile = function (level, row, col) {
            // Requires an any cast due to type incompatibility between
            // dojo promises and native promises.
            return this._fetchTile(level, row, col);
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Fetches the tile at the specified level/row/col. The tile will
         * be composed of tiles fetched from the underlying layers by
         * the multiply operator.
         *
         * @param level the tile level.
         * @param row the tile row.
         * @param col the tile column.
         */
        BlendLayer.prototype._fetchTile = function (level, row, col) {
            return __awaiter(this, void 0, void 0, function () {
                var tilePromises, images, width, height, canvas, context, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tilePromises = this.multiplyLayers.map(function (layer) {
                                // calls fetchTile() on the tile layers returned in multiplyLayers property
                                // for the tiles visible in the view. Wrap result in a native promise.
                                return new Promise(function (resolve, reject) {
                                    layer.fetchTile(level, row, col, { allowImageDataAccess: true })
                                        .then(resolve, reject);
                                });
                            });
                            return [4 /*yield*/, Promise.all(tilePromises)];
                        case 1:
                            images = _a.sent();
                            width = this.tileInfo.size[0];
                            height = this.tileInfo.size[0];
                            canvas = document.createElement("canvas");
                            context = canvas.getContext("2d");
                            canvas.width = width;
                            canvas.height = height;
                            // Use multiply compositing
                            context.globalCompositeOperation = "multiply";
                            // Composite each of the images
                            for (i = 0; i < images.length; i++) {
                                if (this.multiplyLayers[i].visible) {
                                    context.drawImage(images[i], 0, 0, width, height);
                                }
                            }
                            return [2 /*return*/, canvas];
                    }
                });
            });
        };
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], BlendLayer.prototype, "multiplyLayers", void 0);
        BlendLayer = __decorate([
            decorators_1.subclass()
        ], BlendLayer);
        return BlendLayer;
    }(decorators_1.declared(BaseTileLayer)));
    exports.BlendLayer = BlendLayer;
    exports.default = BlendLayer;
});
