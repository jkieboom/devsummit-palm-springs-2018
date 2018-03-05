/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// esri
import { Point } from "esri/geometry";

// esri.core
import watchUtils = require("esri/core/watchUtils");
import Accessor = require("esri/core/Accessor");

// esri.views.3d
import externalRenderers = require("esri/views/3d/externalRenderers");

// app
import { ProgramDefinition, createProgram } from "./webglUtils";

import { mat4, vec3 } from "gl-matrix";

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
@subclass()
export class LavaRenderer extends declared(Accessor) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(obj: ConstructProperties) {
    super();
  }

  initialize() {
    watchUtils.on(this.view, "groundView.elevationSampler", "changed", () => this.requestUpdate());
    this.view.watch("clippingArea", () => this.requestUpdate());

    watchUtils.whenOnce(this.view, "ready", () => {
      externalRenderers.add(this.view, this as any);
    });
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  view
  //----------------------------------

  @property({ constructOnly: true })
  readonly view: esri.SceneView;

  //----------------------------------
  //  bottom
  //----------------------------------

  @property({ constructOnly: true })
  readonly top: number = 0;

  @property({ constructOnly: true })
  readonly bottom: number = 0;

  //----------------------------------
  //  playing
  //----------------------------------

  @property({ value: true })
  set playing(value: boolean) {
    this._set("playing", value);

    if (value) {
      externalRenderers.requestRender(this.view);
    }
  }

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  private vbo: WebGLBuffer;
  private program: ProgramDefinition;
  private needsUpdate: boolean = false;
  private origin = [0, 0, 0];
  private numVertices = 0;
  private viewMatrix = mat4.create();
  private vertexPositionAttributeLocation: number;
  private uvAttributeLocation: number;
  private time = 0;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  setup(context: esri.RenderContext) {
    this.initializeVertexBufferObject(context);
    this.initializeProgram(context);
  }

  render(context: esri.RenderContext) {
    this.update(context);

    const gl = context.gl;

    const { program, uniformLocations } = this.program;

    const camera = context.camera;

    // Setup state
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    // Setup program and uniforms
    gl.useProgram(program);

    const viewMatrix = mat4.translate(this.viewMatrix, camera.viewMatrix, this.origin);
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
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private initializeVertexBufferObject(context: esri.RenderContext) {
    const gl = context.gl;
    this.vbo = gl.createBuffer();
    this.requestUpdate();
  }

  private initializeProgram(context: esri.RenderContext) {
    const gl = context.gl;

    this.program = createProgram(gl, "render",
      // Vertex shader
      `
        precision highp float;

        attribute vec3 aVertexPosition;
        attribute vec2 aUV;

        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform vec2 uResolution;

        uniform float uTop;
        varying vec2 vUV;

        void main() {
          vUV = aUV * uResolution - vec2(0, 100);
          gl_Position = uProjectionMatrix * uViewMatrix * vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z + uTop, 1);
        }
      `,

      // Fragment shader.
      //
      // Shader adapted from https://www.shadertoy.com/view/Xtf3WB.
      // Full credit goes to https://www.shadertoy.com/user/nexor.
      // https://www.shadertoy.com/terms
      // CC BY-NC-SA 3.0
      `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;

        varying vec2 vUV;

        float hash(float n) {
          return fract(sin(n) * 43758.5453);
        }

        float noise(vec2 uv) {
          vec3 x = vec3(uv, 0);

          vec3 p = floor(x);
          vec3 f = fract(x);

          f = f * f * (3.0 - 2.0 * f);
          float n = p.x + p.y * 57.0 + 113.0 * p.z;

          return mix(mix(mix(hash(n+0.0), hash(n+1.0),f.x),
                         mix(hash(n+57.0), hash(n+58.0),f.x),f.y),
                      mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                          mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
        }

        mat2 m = mat2(0.8, 0.6, -0.6, 0.8);

        float fbm(vec2 p) {
            float f = 0.0;

            f += 0.5000*noise( p ); p*=m*2.02;
            f += 0.2500*noise( p ); p*=m*2.03;
            f += 0.1250*noise( p ); p*=m*2.01;
            f += 0.0625*noise( p );

            f /= 0.9375;
            return f;
        }

        vec3 voronoi( in vec2 x ) {
            ivec2 p = ivec2(floor( x ));
            vec2 f = fract(x);

            ivec2 mb = ivec2(0);
            vec2 mr = vec2(0.0);
            vec2 mg = vec2(0.0);

            float md = 8.0;
            for(int j=-1; j<=1; ++j)
            for(int i=-1; i<=1; ++i)
            {
                ivec2 b = ivec2( i, j );
                vec2  r = vec2( b ) + noise( vec2(p + b) ) - f;
                vec2 g = vec2(float(i),float(j));
                vec2 o = vec2(noise( vec2(p) + g ));
                float d = length(r);

                if( d<md )
                {
                    md = d;
                    mr = r;
                    mg = g;
                }
            }

            md = 8.0;
            for(int j=-2; j<=2; ++j) {
              for(int i=-2; i<=2; ++i) {
                  ivec2 b = ivec2( i, j );
                  vec2 r = vec2( b ) + noise( vec2(p + b) ) - f;


                  if( length(r-mr)>0.00001 )
                  md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
              }
            }
            return vec3( md, mr );
        }

        vec2 tr(vec2 p) {
            p = -1.0+2.0*(p/uResolution.xy);
            p.x *= uResolution.x/uResolution.y;
            return p;
        }

        void main() {
          float map_radius = mod(600.0 - 250.0 ,600.0);
          vec2 focus = vec2(0.0,map_radius);
          float crack_radius = 50.0;

          float radius = max(1e-20,map_radius);
          vec2 fc = vUV + focus - uResolution / 2.0;
          vec2 p = tr(fc);

          vec3 col = 	vec3(0.0);

          vec3 lava = vec3(0.0);
          vec3 ground = vec3(0.5,0.3,0.1);
          float vor = 0.0;
          float len = length(fc.y) + cos(fbm(p*15.0)*15.0)*15.0;
            float crack = smoothstep(radius-crack_radius,radius,len);

          {
            float val = 1.0 + cos(p.x*p.y + fbm(p*5.0) * 20.0 + uTime*2.0)/ 2.0;
            lava = vec3(val*1.0, val*0.33, val*0.1);
            lava = mix(lava*0.95,lava,len-radius);
            lava *= exp(-1.8);
          }

          {
            float val = 1.0 + sin(fbm(p * 7.5) * 8.0) / 2.0;
            ground *= exp(-val*0.3);
            vec3 sand = vec3(0.2,0.25,0.0);
            ground = mix(ground,sand,val*0.1);
          }

          {
            vor = voronoi(p*3.5).x*(1.0-crack)*0.75;
            vor = 1.0-vor;
            vor *= smoothstep(0.0,radius,len);
          }

          col = mix(ground,lava,crack);
          col = mix(col,lava,smoothstep(radius-crack_radius,radius,vor*radius));

          gl_FragColor = vec4(col, 1.0);
        }
      `,

      // Uniform names
      ["uViewMatrix", "uProjectionMatrix", "uTime", "uResolution", "uTop"]
    );

    this.vertexPositionAttributeLocation = gl.getAttribLocation(this.program.program, "aVertexPosition");
    this.uvAttributeLocation = gl.getAttribLocation(this.program.program, "aUV");
  }

  /**
   * Update vertex attributes when the clipping area or the ground elevation has changed.
   *
   * @param context the render context
   */
  private update(context: esri.RenderContext) {
    if (!this.needsUpdate) {
      return;
    }

    this.needsUpdate = false;

    const bufferData = this.createBufferData();
    const gl = context.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData.buffer, gl.STATIC_DRAW);

    // Store the origin
    vec3.copy(this.origin as any, bufferData.origin);
    this.numVertices = bufferData.buffer.length / 5;
  }

  /**
   * Request a geometry update. This will flag the need for an update
   * and request a new frame. The update will happen just before the
   * next frame is rendered.
   */
  private requestUpdate() {
    this.needsUpdate = true;
    externalRenderers.requestRender(this.view);
  }

  /**
   * Create the vertex attributes required to render the earth segment.
   */
  private createBufferData() {
    // Sample the ground view around the clipping area at reasonably high resolution.
    // Pull down to create the box.
    const c = this.view.clippingArea;
    const nSamples = 64;
    const nSides = 4;
    const nVerticesPerSegment = 6;
    const nSegments = nSamples - 1;
    const sideStride = nSegments * (nVerticesPerSegment * 3 + nVerticesPerSegment * 2);

    const buffer = (
        this.top
      ? new Float64Array(sideStride * nSides + 30)
      : new Float64Array(sideStride * nSides)
    );

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
    const origin = vec3.set(tmpOrigin as any, c.center.x, c.center.y, 0);
    const bufferInOrigin = new Float32Array(buffer.length);
    this.subtractOrigin(bufferInOrigin, buffer, origin);

    const eps = 1.001;

    // Expand a bit from the center so we don't have issues with z-fighting of the
    // terrain skirts
    for (let i = 0; i < bufferInOrigin.length; i += 5) {
      bufferInOrigin[i + 0] *= eps;
      bufferInOrigin[i + 1] *= eps;
    }

    // Note that in local viewingMode there is no need to project coordinates
    // since the render coordinate system is simply the PCS itself.
    return { buffer: bufferInOrigin, origin };
  }

  private flipUV(buffer: Float64Array, stride: number, idx: number) {
    const start = idx * stride;
    const end = start + stride;

    for (let i = start; i < end; i += 5) {
      buffer[i + 3] = 1 - buffer[i + 3];
    }
  }

  private subtractOrigin(out: Float32Array, buffer: Float64Array, origin: ArrayLike<number>) {
    for (let i = 0; i < buffer.length; i += 5) {
      out[i + 0] = buffer[i + 0] - origin[0];
      out[i + 1] = buffer[i + 1] - origin[1];
      out[i + 2] = buffer[i + 2] - origin[2];

      // Copy over UV
      out[i + 3] = buffer[i + 3];
      out[i + 4] = buffer[i + 4];
    }
  }

  private fillBetween(xmin: number, xmax: number, ymin: number, ymax: number, spatialReference: esri.SpatialReference, buffer: Float64Array, offset: number) {
    const point0 = new Point({ x: 0, y: 0, spatialReference });
    const point1 = new Point({ x: 0, y: 0, spatialReference });
    const point2 = new Point({ x: 0, y: 0, spatialReference });
    const point3 = new Point({ x: 0, y: 0, spatialReference });

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

  }

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
  private sampleAlong(xmin: number, xmax: number, ymin: number, ymax: number, spatialReference: esri.SpatialReference, nSamples: number, buffer: Float64Array, offset: number) {
    const sampler = this.view.groundView.elevationSampler;
    const nSegments = nSamples - 1;

    const dx = xmax - xmin;
    const dy = ymax - ymin;

    const point0 = new Point({ x: 0, y: 0, spatialReference });
    const point1 = new Point({ x: 0, y: 0, spatialReference });

    const maxZ = 10000;

    for (let i = 0; i < nSegments; i++) {
      const pos0 = i / nSegments;
      const pos1 = (i + 1) / nSegments;

      point0.x = xmin + dx * pos0;
      point0.y = ymin + dy * pos0;
      point0.z = this.top ? 0 : sampler.elevationAt(point0) || 0;

      point1.x = xmin + dx * pos1;
      point1.y = ymin + dy * pos1;
      point1.z = this.top ? 0 : sampler.elevationAt(point1) || 0;

      const zRel0 = 1.0 - (point0.z - this.bottom) / maxZ;
      const zRel1 = 1.0 - (point1.z - this.bottom) / maxZ;

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
  }
}

const tmpOrigin = [0, 0, 0];

interface ConstructProperties {
  view: esri.SceneView;
  top?: number;
  bottom: number;
}

export default LavaRenderer;
