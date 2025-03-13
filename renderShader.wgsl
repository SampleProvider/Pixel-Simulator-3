struct VertexInput {
    @location(0) position: vec2<f32>,
    @builtin(instance_index) instance: u32,
}
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
};

@group(0) @binding(0) var<storage> tick: array<u32>;
@group(0) @binding(1) var<storage> grid: array<u32>;

const gridWidth: f32 = GRID_WIDTH;
const gridHeight: f32 = GRID_HEIGHT;
const gridSize: vec2<f32> = vec2<f32>(GRID_WIDTH, GRID_HEIGHT);

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    let instance = f32(input.instance);
    var output: VertexOutput;
    output.position = vec4<f32>((input.position + vec2<f32>(instance % gridWidth, floor(instance / gridWidth))) * 2 / gridSize - vec2<f32>(1, 1), 0, 1);
    switch grid[input.instance] {
        case 0: {
            output.color = vec4<f32>(1, 1, 1, 1);
        }
        case 1: {
            output.color = vec4<f32>(1, 0.9, 0.5, 1);
        }
        case 2: {
            output.color = vec4<f32>(0, 0, 1, 1);
        }
        default: {
            output.color = vec4<f32>(0, 0, 0, 0);
        }
    }

    return output;
};

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.color;
};