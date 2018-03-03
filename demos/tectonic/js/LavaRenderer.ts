/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import { Point } from "esri/geometry";
import watchUtils = require("esri/core/watchUtils");
import Accessor = require("esri/core/Accessor");
import externalRenderers = require("esri/views/3d/externalRenderers");

import { ProgramDefinition, createProgram } from "./webglUtils";

import { mat4, vec3 } from "gl-matrix";

@subclass()
export class LavaRenderer extends declared(Accessor) {
  private vbo: WebGLBuffer;
  private program: ProgramDefinition;
  private needsUpdate: boolean = false;
  private origin = [0, 0, 0];
  private numVertices = 0;
  private viewMatrix = mat4.create();
  private vertexPositionAttributeLocation: number;

  @property({ constructOnly: true })
  readonly view: esri.SceneView;

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

  setup(context: esri.RenderContext) {
    this.initializeVertexBufferObject(context);
    this.initializeProgram(context);
  }

  render(context: esri.RenderContext) {
    this.update(context);

    const gl = context.gl;

    const { program, uniformLocations } = this.program;

    const camera = context.camera;

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.STENCIL_TEST);

    // Setup program and uniforms
    gl.useProgram(program);

    const viewMatrix = mat4.translate(this.viewMatrix, camera.viewMatrix, this.origin);
    gl.uniformMatrix4fv(uniformLocations.uViewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(uniformLocations.uProjectionMatrix, false, camera.projectionMatrix);

    // Bind vertex buffer object and setup attribute pointers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    // Vertex position
    gl.enableVertexAttribArray(this.vertexPositionAttributeLocation);
    gl.vertexAttribPointer(this.vertexPositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);

    // Make sure to reset the WebGL state when finishing the render
    context.resetWebGLState();
  }

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

        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;

        void main() {
          gl_Position = uProjectionMatrix * uViewMatrix * vec4(aVertexPosition, 1);
        }
      `,

      // Fragment shader
      `
        precision highp float;

        void main() {
          gl_FragColor = vec4(1, 0, 1, 1);
        }
      `,

      // Uniform names
      ["uViewMatrix", "uProjectionMatrix"]
    );

    this.vertexPositionAttributeLocation = gl.getAttribLocation(this.program.program, "aVertexPosition");
  }

  private update(context: esri.RenderContext) {
    if (!this.needsUpdate) {
      return;
    }

    this.needsUpdate = false;

    const bufferData = this.createBufferData();
    const gl = context.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData.buffer, gl.STATIC_DRAW);

    vec3.copy(this.origin as any, bufferData.origin);
    this.numVertices = bufferData.buffer.length / 3;
  }

  private requestUpdate() {
    this.needsUpdate = true;
    externalRenderers.requestRender(this.view);
  }

  private createBufferData() {
    // Sample the ground view around the clipping area at reasonably high resolution.
    // Pull down to create the box.
    const c = this.view.clippingArea;
    const nSamples = 64;
    const nSides = 4;
    const nVerticesPerSegment = 6;
    const nSegments = nSamples - 1;
    const sideStride = nSegments * nVerticesPerSegment * 3;
    const buffer = new Float64Array(sideStride * nSides);

    this.sampleAlong(c.xmin, c.xmax, c.ymin, c.ymin, c.spatialReference, nSamples, buffer, 0 * sideStride);
    this.sampleAlong(c.xmax, c.xmax, c.ymin, c.ymax, c.spatialReference, nSamples, buffer, 1 * sideStride);
    this.sampleAlong(c.xmax, c.xmin, c.ymax, c.ymax, c.spatialReference, nSamples, buffer, 2 * sideStride);
    this.sampleAlong(c.xmin, c.xmin, c.ymax, c.ymin, c.spatialReference, nSamples, buffer, 3 * sideStride);

    const origin = vec3.set(tmpOrigin as any, c.center.x, c.center.y, 0);
    const bufferInOrigin = new Float32Array(buffer.length);
    this.subtractOrigin(bufferInOrigin, buffer, origin);

    const eps = 1.001;

    // Expand a bit from the center so we don't have issues with z-fighting of the
    // terrain skirts
    for (let i = 0; i < bufferInOrigin.length; i += 3) {
      bufferInOrigin[i + 0] *= eps;
      bufferInOrigin[i + 1] *= eps;
    }

    // Note that in local viewingMode there is no need to project coordinates
    // since the render coordinate system is simply the PCS itself.
    return { buffer: bufferInOrigin, origin };
  }

  private subtractOrigin(out: Float32Array, buffer: Float64Array, origin: ArrayLike<number>) {
    for (let i = 0; i < buffer.length; i += 3) {
      out[i + 0] = buffer[i + 0] - origin[0];
      out[i + 1] = buffer[i + 1] - origin[1];
      out[i + 2] = buffer[i + 2] - origin[2];
    }
  }

  private sampleAlong(xmin: number, xmax: number, ymin: number, ymax: number, spatialReference: esri.SpatialReference, nSamples: number, buffer: Float64Array, offset: number) {
    const sampler = this.view.groundView.elevationSampler;
    const nSegments = nSamples - 1;

    const dx = xmax - xmin;
    const dy = ymax - ymin;

    const point0 = new Point({ x: 0, y: 0, spatialReference });
    const point1 = new Point({ x: 0, y: 0, spatialReference });

    for (let i = 0; i < nSegments; i++) {
      const pos0 = i / nSegments;
      const pos1 = (i + 1) / nSegments;

      point0.x = xmin + dx * pos0;
      point0.y = ymin + dy * pos0;
      point0.z = sampler.elevationAt(point0) || 0;

      point1.x = xmin + dx * pos1;
      point1.y = ymin + dy * pos1;
      point1.z = sampler.elevationAt(point1) || 0;

      buffer[offset++] = point0.x;
      buffer[offset++] = point0.y;
      buffer[offset++] = point0.z;

      buffer[offset++] = point0.x;
      buffer[offset++] = point0.y;
      buffer[offset++] = 0;

      buffer[offset++] = point1.x;
      buffer[offset++] = point1.y;
      buffer[offset++] = 0;

      buffer[offset++] = point0.x;
      buffer[offset++] = point0.y;
      buffer[offset++] = point0.z;

      buffer[offset++] = point1.x;
      buffer[offset++] = point1.y;
      buffer[offset++] = 0;

      buffer[offset++] = point1.x;
      buffer[offset++] = point1.y;
      buffer[offset++] = point1.z;
    }
  }
}

const tmpOrigin = [0, 0, 0];

interface ConstructProperties {
  view: esri.SceneView;
}

export default LavaRenderer;
