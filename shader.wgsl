struct VertexInput {
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
};