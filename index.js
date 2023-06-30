if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({
    device: device,
    format: canvasFormat,
});

const encoder = device.createCommandEncoder();

var gridWidth = 500;
var gridHeight = 500;


// grid
// nextGrid

  // Create an array representing the active state of each cell.
const grid = new Uint32Array(gridWidth * gridHeight);
const gridBuffer = device.createBuffer({
	label: "Grid",
	size: grid.byteLength,
	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
const nextGridBuffer = device.createBuffer({
	label: "Next Grid",
	size: grid.byteLength,
	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const vertices = new Float32Array([
  //   X,    Y,
  -1, -1, // Triangle 1 (Blue)
  1, -1,
  1,  1,

  -1, -1, // Triangle 2 (Red)
  1,  1,
  -1,  1,
]);
const vertices2 = new Float32Array([
    //   X,    Y,
    -1, -1, // Triangle 1 (Blue)
    1, -1,
    1,  1,
]);

const vertexBuffer = device.createBuffer({
  label: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
const vertexBuffer2 = device.createBuffer({
    label: "Cell vertices",
    size: vertices2.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);
device.queue.writeBuffer(vertexBuffer2, 0, vertices2);

const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [{
    format: "float32x2",
    offset: 0,
    shaderLocation: 0, // Position, see vertex shader
  }],
};
const vertexBuffer2Layout = {
    arrayStride: 8,
    attributes: [{
      format: "float32x2",
      offset: 0,
      shaderLocation: 1, // Position, see vertex shader
    }],
};
const cellShaderModule = device.createShaderModule({
    label: 'Cell shader',
    code: `struct VertexInput {
        @location(0) pos: vec2f,
        @builtin(instance_index) instance: u32,
      };
      
      struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) cell: vec2f, // New line!
      };
      @group(0) @binding(0) var<uniform> grid: vec2f;
      @group(0) @binding(1) var<storage> cellState: array<u32>; // New!
      @group(0) @binding(3) var<storage> camera: vec2f; // New!
      
@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  let i = f32(instance);
  let cell = vec2f(i % grid.x, floor(i / grid.x));
  let state = f32(cellState[instance]); // New line!

  let cellOffset = (cell+camera) / grid * 2;
  // New: Scale the position by the cell's active state.
  let gridPos = (pos*state+1) / grid - 1 + cellOffset;

  var output: VertexOutput;
  output.pos = vec4f(gridPos, 0, 1);
  output.cell = cell;
  return output;
}
      
      @fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let c = input.cell / grid;
  return vec4f(c, 1-c.x, 1);
}
    `
});

// @: This pixel
// _: Empty
// #: Non Empty
// .: Any
// *: Outside grid
// 

const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer = device.createBuffer({
  label: "Grid Uniforms",
  size: uniformArray.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

var cameraArray = new Float32Array([0, 0]);
const cameraBuffer = device.createBuffer({
  label: "Grid Camera",
  size: cameraArray.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(cameraBuffer, 0, cameraArray);
const WORKGROUP_SIZE = 8;
const simulationShaderModule = device.createShaderModule({
    label: "Life simulation shader",
    code: `
      @group(0) @binding(0) var<uniform> grid: vec2f;
  
      @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
      @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;
  
      fn cellIndex(cell: vec2u) -> u32 {
        return (cell.y % u32(grid.y)) * u32(grid.x) +
                (cell.x % u32(grid.x));
      }
  
      fn cellActive(x: u32, y: u32) -> u32 {
        return cellStateIn[cellIndex(vec2(x, y))];
      }
  
      @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
      fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
        // Determine how many active neighbors this cell has.
        let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                              cellActive(cell.x+1, cell.y) +
                              cellActive(cell.x+1, cell.y-1) +
                              cellActive(cell.x, cell.y-1) +
                              cellActive(cell.x-1, cell.y-1) +
                              cellActive(cell.x-1, cell.y) +
                              cellActive(cell.x-1, cell.y+1) +
                              cellActive(cell.x, cell.y+1);
  
        let i = cellIndex(cell.xy);
  
        // Conway's game of life rules:
        switch activeNeighbors {
          case 2: {
            cellStateOut[i] = cellStateIn[i];
          }
          case 3: {
            cellStateOut[i] = 1;
          }
          default: {
            cellStateOut[i] = 0;
          }
        }
      }
    `
  });
// Create the bind group layout and pipeline layout.
const bindGroupLayout = device.createBindGroupLayout({
    label: "Cell Bind Group Layout",
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
      buffer: {} // Grid uniform buffer
    }, {
      binding: 1,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
      buffer: { type: "read-only-storage"} // Cell state input buffer
    }, {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage"} // Cell state output buffer
      }, {
        binding: 3,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "read-only-storage"} // Cell state input buffer
      }]
  });
// Create a bind group to pass the grid uniforms into the pipeline
const bindGroups = [
    device.createBindGroup({
      label: "Cell renderer bind group A",
      layout: bindGroupLayout, // Updated Line
      entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }, {
            binding: 1,
            resource: { buffer: cellStateStorage[0] }
        }, {
            binding: 2, // New Entry
            resource: { buffer: cellStateStorage[1] }
        }, {
            binding: 3, // New Entry
            resource: { buffer: cameraBuffer }
        }],
    }),
    device.createBindGroup({
      label: "Cell renderer bind group B",
      layout: bindGroupLayout, // Updated Line
  
      entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer }
      }, {
        binding: 1,
        resource: { buffer: cellStateStorage[1] }
      }, {
        binding: 2, // New Entry
        resource: { buffer: cellStateStorage[0] }
      }, {
        binding: 3, // New Entry
        resource: { buffer: cameraBuffer }
      }],
    }),
  ];
  const pipelineLayout = device.createPipelineLayout({
    label: "Cell Pipeline Layout",
    bindGroupLayouts: [ bindGroupLayout ],
  });
  const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: pipelineLayout, // Updated!
    vertex: {
      module: cellShaderModule,
      entryPoint: "vertexMain",
      buffers: [vertexBufferLayout]
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: "fragmentMain",
      targets: [{
        format: canvasFormat
      }]
    }
  });
  // Create a compute pipeline that updates the game state.
const simulationPipeline = device.createComputePipeline({
    label: "Simulation pipeline",
    layout: pipelineLayout,
    compute: {
      module: simulationShaderModule,
      entryPoint: "computeMain",
    }
  });
  const UPDATE_INTERVAL = 1000/60; // Update every 200ms (5 times/sec)
//   const UPDATE_INTERVAL = 200; // Update every 200ms (5 times/sec)
let step = 0; // Track how many simulation steps have been run

var cameraX = 0;
var cameraY = 0;

var fps = [];


var wDown = false;
var sDown = false;
var aDown = false;
var dDown = false;
document.addEventListener("keydown", function(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            wDown = true;
            break;
        case "s":
            sDown = true;
            break;
        case "a":
            aDown = true;
            break;
        case "d":
            dDown = true;
            break;
    }
});
document.addEventListener("keyup", function(event) {
    switch (event.key.toLowerCase()) {
        case "w":
            wDown = false;
            break;
        case "s":
            sDown = false;
            break;
        case "a":
            aDown = false;
            break;
        case "d":
            dDown = false;
            break;
    }
});
var averageTick = 0;
// Move all of our rendering code into a function
function updateGrid() {// In updateGrid()
    var start = performance.now();

    if (wDown) {
        cameraArray[1] -= 1;
    }
    if (sDown) {
        cameraArray[1] += 1;
    }
    if (aDown) {
        cameraArray[0] += 1;
    }
    if (dDown) {
        cameraArray[0] -= 1;
    }
    device.queue.writeBuffer(cameraBuffer, 0, cameraArray);
    // Move the encoder creation to the top of the function.
    const encoder = device.createCommandEncoder();
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);

    // New lines
    const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

    computePass.end();
    
    // Existing lines
    step++; // Increment the step count
    
    // Start a render pass 
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
        storeOp: "store",
      }]
    });
  
    // Draw the grid.
    pass.setPipeline(cellPipeline);
    pass.setBindGroup(0, bindGroups[step % 2]); // Updated!
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);
  
    // End the render pass and submit the command buffer
    pass.end();
    device.queue.submit([encoder.finish()]);
    fps.push(performance.now());
    while (performance.now() - fps[0] > 1000) {
        fps.shift();
    }
    averageTick = (averageTick * 0.9 + (performance.now() - start) * 0.1);
    fpsDisplay.innerText = fps.length + " " + averageTick.toFixed(2);
  }
  
a

  // Schedule updateGrid() to run repeatedly
  setInterval(updateGrid, UPDATE_INTERVAL);