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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/geometry", "esri/core/watchUtils", "esri/core/Accessor", "esri/core/accessorSupport/decorators", "esri/views/3d/externalRenderers", "./webglUtils", "gl-matrix"], function (require, exports, __extends, __decorate, geometry_1, watchUtils, Accessor, decorators_1, externalRenderers, webglUtils_1, gl_matrix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * External renderer to render a segment of "earth" below
     * the clipped view area. The segment is made "interesting"
     * by applying an animation in the shader to emulate soil
     * and lava flow. Note that the visualization is purely
     * for schematic reasons and does not represent real data.
     *
     * The original shader was taken from shadertoy:
     *   Shader adapted from https://www.shadertoy.com/view/Xtf3WB.
     *   Full credit goes to https://www.shadertoy.com/user/nexor.
     *   https://www.shadertoy.com/terms
     *   CC BY-NC-SA 3.0
     */
    var LavaRenderer = /** @class */ (function (_super) {
        __extends(LavaRenderer, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function LavaRenderer(obj) {
            var _this = _super.call(this) || this;
            //----------------------------------
            //  bottom
            //----------------------------------
            _this.top = 0;
            _this.bottom = 0;
            _this.needsUpdate = false;
            _this.origin = [0, 0, 0];
            _this.numVertices = 0;
            _this.viewMatrix = gl_matrix_1.mat4.create();
            _this.time = 0;
            return _this;
        }
        LavaRenderer.prototype.initialize = function () {
            var _this = this;
            watchUtils.on(this.view, "groundView.elevationSampler", "changed", function () { return _this.requestUpdate(); });
            this.view.watch("clippingArea", function () { return _this.requestUpdate(); });
            watchUtils.whenOnce(this.view, "ready", function () {
                externalRenderers.add(_this.view, _this);
            });
        };
        Object.defineProperty(LavaRenderer.prototype, "playing", {
            //----------------------------------
            //  playing
            //----------------------------------
            set: function (value) {
                this._set("playing", value);
                if (value) {
                    externalRenderers.requestRender(this.view);
                }
            },
            enumerable: true,
            configurable: true
        });
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        LavaRenderer.prototype.setup = function (context) {
            this.initializeVertexBufferObject(context);
            this.initializeProgram(context);
        };
        LavaRenderer.prototype.render = function (context) {
            this.update(context);
            var gl = context.gl;
            var _a = this.program, program = _a.program, uniformLocations = _a.uniformLocations;
            var camera = context.camera;
            // Setup state
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.depthMask(true);
            // Setup program and uniforms
            gl.useProgram(program);
            var viewMatrix = gl_matrix_1.mat4.translate(this.viewMatrix, camera.viewMatrix, this.origin);
            gl.uniformMatrix4fv(uniformLocations.uViewMatrix, false, viewMatrix);
            gl.uniformMatrix4fv(uniformLocations.uProjectionMatrix, false, camera.projectionMatrix);
            gl.uniform1f(uniformLocations.uTime, this.time);
            gl.uniform1f(uniformLocations.uTop, this.top);
            gl.uniform2f(uniformLocations.uResolution, 800, 800);
            if (this.playing) {
                this.time += 0.01;
            }
            // Bind vertex buffer object and setup attribute pointers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            // Vertex position
            gl.enableVertexAttribArray(this.vertexPositionAttributeLocation);
            gl.vertexAttribPointer(this.vertexPositionAttributeLocation, 3, gl.FLOAT, false, 20, 0);
            // UV
            gl.enableVertexAttribArray(this.uvAttributeLocation);
            gl.vertexAttribPointer(this.uvAttributeLocation, 2, gl.FLOAT, false, 20, 12);
            // Draw triangles
            gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
            // Make sure to reset the WebGL state when finishing the render
            context.resetWebGLState();
            if (this.playing) {
                // If we are playing continuously, request a new render
                externalRenderers.requestRender(this.view);
            }
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        LavaRenderer.prototype.initializeVertexBufferObject = function (context) {
            var gl = context.gl;
            this.vbo = gl.createBuffer();
            this.requestUpdate();
        };
        LavaRenderer.prototype.initializeProgram = function (context) {
            var gl = context.gl;
            this.program = webglUtils_1.createProgram(gl, "render", 
            // Vertex shader
            "\n        precision highp float;\n\n        attribute vec3 aVertexPosition;\n        attribute vec2 aUV;\n\n        uniform mat4 uViewMatrix;\n        uniform mat4 uProjectionMatrix;\n        uniform vec2 uResolution;\n\n        uniform float uTop;\n        varying vec2 vUV;\n\n        void main() {\n          vUV = aUV * uResolution - vec2(0, -200);\n          gl_Position = uProjectionMatrix * uViewMatrix * vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z + uTop, 1);\n        }\n      ", 
            // Fragment shader.
            //
            // Shader adapted from https://www.shadertoy.com/view/Xtf3WB.
            // Full credit goes to https://www.shadertoy.com/user/nexor.
            // https://www.shadertoy.com/terms
            // CC BY-NC-SA 3.0
            "\n        precision highp float;\n\n        uniform float uTime;\n        uniform vec2 uResolution;\n\n        varying vec2 vUV;\n\n        float hash(float n) {\n          return fract(sin(n) * 43758.5453);\n        }\n\n        float noise(vec2 uv) {\n          vec3 x = vec3(uv, 0);\n\n          vec3 p = floor(x);\n          vec3 f = fract(x);\n\n          f = f * f * (3.0 - 2.0 * f);\n          float n = p.x + p.y * 57.0 + 113.0 * p.z;\n\n          return mix(mix(mix(hash(n+0.0), hash(n+1.0),f.x),\n                         mix(hash(n+57.0), hash(n+58.0),f.x),f.y),\n                      mix(mix( hash(n+113.0), hash(n+114.0),f.x),\n                          mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);\n        }\n\n        mat2 m = mat2(0.8, 0.6, -0.6, 0.8);\n\n        float fbm(vec2 p) {\n            float f = 0.0;\n\n            f += 0.5000*noise( p ); p*=m*2.02;\n            f += 0.2500*noise( p ); p*=m*2.03;\n            f += 0.1250*noise( p ); p*=m*2.01;\n            f += 0.0625*noise( p );\n\n            f /= 0.9375;\n            return f;\n        }\n\n        vec3 voronoi( in vec2 x ) {\n            ivec2 p = ivec2(floor( x ));\n            vec2 f = fract(x);\n\n            ivec2 mb = ivec2(0);\n            vec2 mr = vec2(0.0);\n            vec2 mg = vec2(0.0);\n\n            float md = 8.0;\n            for(int j=-1; j<=1; ++j)\n            for(int i=-1; i<=1; ++i)\n            {\n                ivec2 b = ivec2( i, j );\n                vec2  r = vec2( b ) + noise( vec2(p + b) ) - f;\n                vec2 g = vec2(float(i),float(j));\n                vec2 o = vec2(noise( vec2(p) + g ));\n                float d = length(r);\n\n                if( d<md )\n                {\n                    md = d;\n                    mr = r;\n                    mg = g;\n                }\n            }\n\n            md = 8.0;\n            for(int j=-2; j<=2; ++j) {\n              for(int i=-2; i<=2; ++i) {\n                  ivec2 b = ivec2( i, j );\n                  vec2 r = vec2( b ) + noise( vec2(p + b) ) - f;\n\n\n                  if( length(r-mr)>0.00001 )\n                  md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );\n              }\n            }\n            return vec3( md, mr );\n        }\n\n        vec2 tr(vec2 p) {\n            p = -1.0+2.0*(p/uResolution.xy);\n            p.x *= uResolution.x/uResolution.y;\n            return p;\n        }\n\n        void main() {\n          float map_radius = mod(600.0 - 250.0 ,600.0);\n          vec2 focus = vec2(0.0,map_radius);\n          float crack_radius = 50.0;\n\n          float radius = max(1e-20,map_radius);\n          vec2 fc = vUV + focus - uResolution / 2.0;\n          vec2 p = tr(fc);\n\n          vec3 col = \tvec3(0.0);\n\n          vec3 lava = vec3(0.0);\n          vec3 ground = vec3(0.5,0.3,0.1);\n          float vor = 0.0;\n          float len = length(fc.y) + cos(fbm(p*15.0)*15.0)*15.0;\n            float crack = smoothstep(radius-crack_radius,radius,len);\n\n          {\n            float val = 1.0 + cos(p.x*p.y + fbm(p*5.0) * 20.0 + uTime*2.0)/ 2.0;\n            lava = vec3(val*1.0, val*0.33, val*0.1);\n            lava = mix(lava*0.95,lava,len-radius);\n            lava *= exp(-1.8);\n          }\n\n          {\n            float val = 1.0 + sin(fbm(p * 7.5) * 8.0) / 2.0;\n            ground *= exp(-val*0.3);\n            vec3 sand = vec3(0.2,0.25,0.0);\n            ground = mix(ground,sand,val*0.1);\n          }\n\n          {\n            vor = voronoi(p*3.5).x*(1.0-crack)*0.75;\n            vor = 1.0-vor;\n            vor *= smoothstep(0.0,radius,len);\n          }\n\n          col = mix(ground,lava,crack);\n          col = mix(col,lava,smoothstep(radius-crack_radius,radius,vor*radius));\n\n          gl_FragColor = vec4(col, 1.0);\n        }\n      ", 
            // Uniform names
            ["uViewMatrix", "uProjectionMatrix", "uTime", "uResolution", "uTop"]);
            this.vertexPositionAttributeLocation = gl.getAttribLocation(this.program.program, "aVertexPosition");
            this.uvAttributeLocation = gl.getAttribLocation(this.program.program, "aUV");
        };
        /**
         * Update vertex attributes when the clipping area or the ground elevation has changed.
         *
         * @param context the render context
         */
        LavaRenderer.prototype.update = function (context) {
            if (!this.needsUpdate) {
                return;
            }
            this.needsUpdate = false;
            var bufferData = this.createBufferData();
            var gl = context.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, bufferData.buffer, gl.STATIC_DRAW);
            // Store the origin
            gl_matrix_1.vec3.copy(this.origin, bufferData.origin);
            this.numVertices = bufferData.buffer.length / 5;
        };
        /**
         * Request a geometry update. This will flag the need for an update
         * and request a new frame. The update will happen just before the
         * next frame is rendered.
         */
        LavaRenderer.prototype.requestUpdate = function () {
            this.needsUpdate = true;
            externalRenderers.requestRender(this.view);
        };
        /**
         * Create the vertex attributes required to render the earth segment.
         */
        LavaRenderer.prototype.createBufferData = function () {
            // Sample the ground view around the clipping area at reasonably high resolution.
            // Pull down to create the box.
            var c = this.view.clippingArea;
            var nSamples = 64;
            var nSides = 4;
            var nVerticesPerSegment = 6;
            var nSegments = nSamples - 1;
            var sideStride = nSegments * (nVerticesPerSegment * 3 + nVerticesPerSegment * 2);
            var buffer = (this.top
                ? new Float64Array(sideStride * nSides + 30)
                : new Float64Array(sideStride * nSides));
            this.sampleAlong(c.xmin, c.xmax, c.ymin, c.ymin, c.spatialReference, nSamples, buffer, 0 * sideStride);
            this.sampleAlong(c.xmax, c.xmax, c.ymin, c.ymax, c.spatialReference, nSamples, buffer, 1 * sideStride);
            this.sampleAlong(c.xmax, c.xmin, c.ymax, c.ymax, c.spatialReference, nSamples, buffer, 2 * sideStride);
            this.sampleAlong(c.xmin, c.xmin, c.ymax, c.ymin, c.spatialReference, nSamples, buffer, 3 * sideStride);
            if (this.top) {
                this.fillBetween(c.xmin, c.xmax, c.ymin, c.ymax, c.spatialReference, buffer, sideStride * nSides);
            }
            // Flip UV of odd segments so it looks continuous
            this.flipUV(buffer, sideStride, 1);
            this.flipUV(buffer, sideStride, 3);
            // Calculate a local origin to improve render precision
            var origin = gl_matrix_1.vec3.set(tmpOrigin, c.center.x, c.center.y, 0);
            var bufferInOrigin = new Float32Array(buffer.length);
            this.subtractOrigin(bufferInOrigin, buffer, origin);
            var eps = 1.001;
            // Expand a bit from the center so we don't have issues with z-fighting of the
            // terrain skirts
            for (var i = 0; i < bufferInOrigin.length; i += 5) {
                bufferInOrigin[i + 0] *= eps;
                bufferInOrigin[i + 1] *= eps;
            }
            // Note that in local viewingMode there is no need to project coordinates
            // since the render coordinate system is simply the PCS itself.
            return { buffer: bufferInOrigin, origin: origin };
        };
        LavaRenderer.prototype.flipUV = function (buffer, stride, idx) {
            var start = idx * stride;
            var end = start + stride;
            for (var i = start; i < end; i += 5) {
                buffer[i + 3] = 1 - buffer[i + 3];
            }
        };
        LavaRenderer.prototype.subtractOrigin = function (out, buffer, origin) {
            for (var i = 0; i < buffer.length; i += 5) {
                out[i + 0] = buffer[i + 0] - origin[0];
                out[i + 1] = buffer[i + 1] - origin[1];
                out[i + 2] = buffer[i + 2] - origin[2];
                // Copy over UV
                out[i + 3] = buffer[i + 3];
                out[i + 4] = buffer[i + 4];
            }
        };
        LavaRenderer.prototype.fillBetween = function (xmin, xmax, ymin, ymax, spatialReference, buffer, offset) {
            var point0 = new geometry_1.Point({ x: 0, y: 0, spatialReference: spatialReference });
            var point1 = new geometry_1.Point({ x: 0, y: 0, spatialReference: spatialReference });
            var point2 = new geometry_1.Point({ x: 0, y: 0, spatialReference: spatialReference });
            var point3 = new geometry_1.Point({ x: 0, y: 0, spatialReference: spatialReference });
            point0.x = xmin;
            point0.y = ymin;
            point0.z = 0;
            point1.x = xmax;
            point1.y = ymin;
            point1.z = 0;
            point2.x = xmax;
            point2.y = ymax;
            point2.z = 0;
            point3.x = xmin;
            point3.y = ymax;
            point3.z = 0;
            buffer[offset++] = point0.x;
            buffer[offset++] = point0.y;
            buffer[offset++] = point0.z;
            buffer[offset++] = 0.0;
            buffer[offset++] = 0.0;
            buffer[offset++] = point1.x;
            buffer[offset++] = point1.y;
            buffer[offset++] = point1.z;
            buffer[offset++] = 0.5;
            buffer[offset++] = 0.0;
            buffer[offset++] = point2.x;
            buffer[offset++] = point2.y;
            buffer[offset++] = point2.z;
            buffer[offset++] = 0.5;
            buffer[offset++] = 0.5;
            // 2
            buffer[offset++] = point2.x;
            buffer[offset++] = point2.y;
            buffer[offset++] = point2.z;
            buffer[offset++] = 0.5;
            buffer[offset++] = 0.5;
            buffer[offset++] = point3.x;
            buffer[offset++] = point3.y;
            buffer[offset++] = point3.z;
            buffer[offset++] = 0.0;
            buffer[offset++] = 0.5;
            buffer[offset++] = point0.x;
            buffer[offset++] = point0.y;
            buffer[offset++] = point0.z;
            buffer[offset++] = 0.0;
            buffer[offset++] = 0.0;
        };
        /**
         * Populate the buffer with the specified number of vertices by
         * sampling elevation data from the ground view along the line
         * specified by xmin, xmax, ymin and ymax.
         *
         * @param xmin
         * @param xmax
         * @param ymin
         * @param ymax
         * @param spatialReference
         * @param nSamples
         * @param buffer
         * @param offset
         */
        LavaRenderer.prototype.sampleAlong = function (xmin, xmax, ymin, ymax, spatialReference, nSamples, buffer, offset) {
            var sampler = this.view.groundView.elevationSampler;
            var nSegments = nSamples - 1;
            var dx = xmax - xmin;
            var dy = ymax - ymin;
            var point0 = new geometry_1.Point({ x: 0, y: 0, spatialReference: spatialReference });
            var point1 = new geometry_1.Point({ x: 0, y: 0, spatialReference: spatialReference });
            var maxZ = 10000;
            for (var i = 0; i < nSegments; i++) {
                var pos0 = i / nSegments;
                var pos1 = (i + 1) / nSegments;
                point0.x = xmin + dx * pos0;
                point0.y = ymin + dy * pos0;
                point0.z = this.top ? 0 : sampler.queryElevation(point0).z || 0;
                point1.x = xmin + dx * pos1;
                point1.y = ymin + dy * pos1;
                point1.z = this.top ? 0 : sampler.queryElevation(point1).z || 0;
                var zRel0 = 1.0 - (point0.z - this.bottom) / maxZ;
                var zRel1 = 1.0 - (point1.z - this.bottom) / maxZ;
                buffer[offset++] = point0.x;
                buffer[offset++] = point0.y;
                buffer[offset++] = point0.z;
                buffer[offset++] = pos0;
                buffer[offset++] = zRel0;
                buffer[offset++] = point0.x;
                buffer[offset++] = point0.y;
                buffer[offset++] = this.bottom;
                buffer[offset++] = pos0;
                buffer[offset++] = 1;
                buffer[offset++] = point1.x;
                buffer[offset++] = point1.y;
                buffer[offset++] = this.bottom;
                buffer[offset++] = pos1;
                buffer[offset++] = 1;
                buffer[offset++] = point0.x;
                buffer[offset++] = point0.y;
                buffer[offset++] = point0.z;
                buffer[offset++] = pos0;
                buffer[offset++] = zRel0;
                buffer[offset++] = point1.x;
                buffer[offset++] = point1.y;
                buffer[offset++] = this.bottom;
                buffer[offset++] = pos1;
                buffer[offset++] = 1;
                buffer[offset++] = point1.x;
                buffer[offset++] = point1.y;
                buffer[offset++] = point1.z;
                buffer[offset++] = pos1;
                buffer[offset++] = zRel1;
            }
        };
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], LavaRenderer.prototype, "view", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], LavaRenderer.prototype, "top", void 0);
        __decorate([
            decorators_1.property({ constructOnly: true })
        ], LavaRenderer.prototype, "bottom", void 0);
        __decorate([
            decorators_1.property({ value: true })
        ], LavaRenderer.prototype, "playing", null);
        LavaRenderer = __decorate([
            decorators_1.subclass()
        ], LavaRenderer);
        return LavaRenderer;
    }(decorators_1.declared(Accessor)));
    exports.LavaRenderer = LavaRenderer;
    var tmpOrigin = [0, 0, 0];
    exports.default = LavaRenderer;
});
