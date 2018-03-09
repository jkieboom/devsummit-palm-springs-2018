/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />
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
define(["require", "exports", "esri/core/tsSupport/generatorHelper", "esri/core/tsSupport/awaiterHelper", "esri/geometry", "esri/core/watchUtils", "esri/tasks/QueryTask", "./ScrollAlong", "./DOMElement3D", "./Overview", "./View"], function (require, exports, __generator, __awaiter, geometry_1, watchUtils, QueryTask, ScrollAlong_1, DOMElement3D_1, Overview_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function run() {
        return __awaiter(this, void 0, void 0, function () {
            var tectonicPlateBoundaryLine, view;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getTectonicPlateBoundaryLine()];
                    case 1:
                        tectonicPlateBoundaryLine = _a.sent();
                        view = new View_1.View({ tectonicPlateBoundaryLine: tectonicPlateBoundaryLine });
                        // Step 2: Overview map
                        //
                        createOverview(view);
                        // Step 3: Custom 2.5D dom
                        //
                        create3DDOMElements(view);
                        // Step 6: Camera updates
                        //
                        createScrollAlong(view, tectonicPlateBoundaryLine);
                        window.view = view;
                        return [2 /*return*/];
                }
            });
        });
    }
    exports.run = run;
    function createOverview(view) {
        return new Overview_1.Overview({ viewport: view.viewport });
    }
    function createScrollAlong(view, path) {
        return new ScrollAlong_1.ScrollAlong({ view: view.view, viewport: view.viewport, path: path });
    }
    function create3DDOMElements(view) {
        create3DDOMTitle(view);
        create3DDOMDescription(view);
    }
    function create3DDOMDescription(view) {
        var titleElement = document.getElementById("description");
        var domElement = new DOMElement3D_1.DOMElement3D({ view: view.view, element: titleElement, heading: 90 });
        watchUtils.init(view.viewport, "clippingArea", function () {
            var clip = view.viewport.clippingArea;
            var spatialReference = clip.spatialReference;
            // Position the element in between the ymin segment of the clipping area
            var location = new geometry_1.Point({ x: clip.xmax, y: (clip.ymin + clip.ymax) / 2, z: 6500, spatialReference: spatialReference });
            domElement.location = location;
        });
    }
    function create3DDOMTitle(view) {
        var titleElement = document.getElementById("title");
        var domElement = new DOMElement3D_1.DOMElement3D({ view: view.view, element: titleElement, heading: -180 });
        watchUtils.init(view.viewport, "clippingArea", function () {
            var clip = view.viewport.clippingArea;
            var spatialReference = clip.spatialReference;
            // Position the element in between the ymin segment of the clipping area
            var location = new geometry_1.Point({ x: (clip.xmin + clip.xmax) / 2, y: clip.ymin, z: 8000, spatialReference: spatialReference });
            domElement.location = location;
        });
    }
    function getTectonicPlateBoundaryLine() {
        return __awaiter(this, void 0, void 0, function () {
            var query, featureSet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = new QueryTask({
                            url: boundariesServiceUrl
                        });
                        return [4 /*yield*/, query.execute({
                                where: "Name = 'EU-IN'",
                                returnGeometry: true
                            })];
                    case 1:
                        featureSet = _a.sent();
                        return [2 /*return*/, featureSet.features[1].geometry];
                }
            });
        });
    }
    var boundariesServiceUrl = "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0";
});
