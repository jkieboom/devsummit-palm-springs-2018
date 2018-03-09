export interface ProgramDefinition {
  program: WebGLProgram;
  uniformLocations: { [key: string]: WebGLUniformLocation };
}

export function createProgram(gl: WebGLRenderingContext, name: string, vertex: string, fragment: string, uniforms?: string[]): ProgramDefinition {
  const program = gl.createProgram();
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertex);
  gl.compileShader(vertexShader);
  programLog(`${name} - vertex`, gl.getShaderInfoLog(vertexShader));

  gl.shaderSource(fragmentShader, fragment);
  gl.compileShader(fragmentShader);
  programLog(`${name} - fragment`, gl.getShaderInfoLog(fragmentShader));

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  programLog(`${name} - link program`, gl.getProgramInfoLog(program));

  const uniformLocations: { [key: string]: WebGLUniformLocation } = {};

  if (uniforms) {
    for (const uniformName of uniforms) {
      uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
    }
  }

  return {
    program,
    uniformLocations
  };
}

function programLog(name: string, info: string) {
  if (info) {
    console.error("Failed to compile or link", name, info);
  }
}
