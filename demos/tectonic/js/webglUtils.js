define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createProgram(gl, name, vertex, fragment, uniforms) {
        var program = gl.createProgram();
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vertexShader, vertex);
        gl.compileShader(vertexShader);
        programLog(name + " - vertex", gl.getShaderInfoLog(vertexShader));
        gl.shaderSource(fragmentShader, fragment);
        gl.compileShader(fragmentShader);
        programLog(name + " - fragment", gl.getShaderInfoLog(fragmentShader));
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        programLog(name + " - link program", gl.getProgramInfoLog(program));
        var uniformLocations = {};
        if (uniforms) {
            for (var _i = 0, uniforms_1 = uniforms; _i < uniforms_1.length; _i++) {
                var uniformName = uniforms_1[_i];
                uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
            }
        }
        return {
            program: program,
            uniformLocations: uniformLocations
        };
    }
    exports.createProgram = createProgram;
    function programLog(name, info) {
        if (info) {
            console.error("Failed to compile or link", name, info);
        }
    }
});
