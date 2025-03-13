
@group(0) @binding(0) var<storage> tick: array<u32>;
@group(0) @binding(1) var<storage, read_write> grid1: array<u32>;
@group(0) @binding(2) var<storage, read_write> grid2: array<u32>;

const gridWidth: u32 = GRID_WIDTH;
const gridHeight: u32 = GRID_HEIGHT;

const AIR = 0;
const SAND = 1;
const WATER = 2;

const NONE = 255;

fn random(number: f32) -> f32 {
    return fract(sin(number + 100000) * 43758.5453123);
};

fn isFluid(id: u32) -> bool {
    return id == AIR || id == WATER;
};

@compute @workgroup_size(1, 1)
fn compute1Main(@builtin(global_invocation_id) pixel: vec3<u32>) {
    if pixel.x >= gridWidth || pixel.y >= gridHeight {
        return;
    }
    let index = pixel.x + pixel.y * gridWidth;
    // if random(f32((tick[0] * gridWidth * gridHeight + index) % 9192)) < 0.5 {
    //     grid2[index] = SAND;
    // }
    // else {
    //     grid2[index] = WATER;
    // }
    // return;
    switch grid1[index] {
        case AIR: {
            if grid2[index] != NONE {
                return;
            }
            if pixel.x != 0 && grid1[index - 1] == WATER {
                // if isFluid(grid1[index - 1 - gridWidth]) && grid1[index - 1 - gridWidth] != WATER && grid2[index - 1 - gridWidth] == NONE {
                //     grid2[index] = grid1[index - 1 - gridWidth];
                //     grid2[index - 1 - gridWidth] = WATER;
                //     return;
                // }
                // else
                if grid2[index - 1] == NONE {
                    grid2[index] = grid1[index - 1];
                    grid2[index - 1] = AIR;
                    return;
                }
            }
            return;
        }
        case SAND: {
            if grid2[index] != NONE {
                return;
            }
            if pixel.y != 0 {
                if isFluid(grid1[index - gridWidth]) && grid2[index - gridWidth] == NONE {
                    grid2[index] = grid1[index - gridWidth];
                    grid2[index - gridWidth] = SAND;
                }
                else {
                    // if random(f32(tick[0] * gridWidth * gridHeight + index)) < 0.5 {
                    if random(f32((tick[0] * gridWidth * gridHeight + index) % 9192)) < 0.5 {
                    // if tick[0] % 2 == 0 {
                        if pixel.x != 0 && isFluid(grid1[index - 1]) {
                            if isFluid(grid1[index - 1 - gridWidth]) && grid2[index - 1 - gridWidth] == NONE {
                                grid2[index] = grid1[index - 1 - gridWidth];
                                grid2[index - 1 - gridWidth] = SAND;
                                return;
                            }
                        }
                        if pixel.x != gridWidth - 1 && isFluid(grid1[index + 1]) {
                            if isFluid(grid1[index + 1 - gridWidth]) && grid2[index + 1 - gridWidth] == NONE {
                                grid2[index] = grid1[index + 1 - gridWidth];
                                grid2[index + 1 - gridWidth] = SAND;
                                return;
                            }
                        }
                    }
                    else {
                        if pixel.x != gridWidth - 1 && isFluid(grid1[index + 1]) {
                            if isFluid(grid1[index + 1 - gridWidth]) && grid2[index + 1 - gridWidth] == NONE {
                                grid2[index] = grid1[index + 1 - gridWidth];
                                grid2[index + 1 - gridWidth] = SAND;
                                return;
                            }
                        }
                        if pixel.x != 0 && isFluid(grid1[index - 1]) {
                            if isFluid(grid1[index - 1 - gridWidth]) && grid2[index - 1 - gridWidth] == NONE {
                                grid2[index] = grid1[index - 1 - gridWidth];
                                grid2[index - 1 - gridWidth] = SAND;
                                return;
                            }
                        }
                    }
                }
            }
        }
        case WATER: {
            if grid2[index] != NONE {
                return;
            }
            if pixel.y != 0 {
                if isFluid(grid1[index - gridWidth]) && grid1[index - gridWidth] != WATER && grid2[index - gridWidth] == NONE {
                    grid2[index] = grid1[index - gridWidth];
                    grid2[index - gridWidth] = WATER;
                }
                else {
                    if pixel.x != 0 && isFluid(grid1[index - 1]) && grid1[index - 1] != WATER {
                        // if isFluid(grid1[index - 1 - gridWidth]) && grid1[index - 1 - gridWidth] != WATER && grid2[index - 1 - gridWidth] == NONE {
                        //     grid2[index] = grid1[index - 1 - gridWidth];
                        //     grid2[index - 1 - gridWidth] = WATER;
                        //     return;
                        // }
                        // else
                        if grid2[index - 1] == NONE {
                            grid2[index] = grid1[index - 1];
                            grid2[index - 1] = WATER;
                            return;
                        }
                    }
                    return;
                    // if random(f32(tick[0] * gridWidth * gridHeight + index)) < 0.5 {
                    // if random(f32((tick[0] * gridWidth * gridHeight + index) % 9182)) < 0.5 {
                    if (tick[0]) % 2 == 0 {
                    // if (tick[0] % (index * index) <= u32(index / 2)) {
                        if pixel.x != 0 && isFluid(grid1[index - 1]) && grid1[index - 1] != WATER {
                            // if isFluid(grid1[index - 1 - gridWidth]) && grid1[index - 1 - gridWidth] != WATER && grid2[index - 1 - gridWidth] == NONE {
                            //     grid2[index] = grid1[index - 1 - gridWidth];
                            //     grid2[index - 1 - gridWidth] = WATER;
                            //     return;
                            // }
                            // else
                            if grid2[index - 1] == NONE {
                                grid2[index] = grid1[index - 1];
                                grid2[index - 1] = WATER;
                                return;
                            }
                        }
                        // if pixel.x != gridWidth - 1 && isFluid(grid1[index + 1]) && grid1[index + 1] != WATER {
                        //     if isFluid(grid1[index + 1 - gridWidth]) && grid1[index + 1 - gridWidth] != WATER && grid2[index + 1 - gridWidth] == NONE {
                        //         grid2[index] = grid1[index + 1 - gridWidth];
                        //         grid2[index + 1 - gridWidth] = WATER;
                        //         return;
                        //     }
                        //     else if grid2[index + 1] == NONE {
                        //         grid2[index] = grid1[index + 1];
                        //         grid2[index + 1] = WATER;
                        //         return;
                        //     }
                        // }
                    }
                    else {
                        if pixel.x != gridWidth - 1 && isFluid(grid1[index + 1]) && grid1[index + 1] != WATER {
                            // if isFluid(grid1[index + 1 - gridWidth]) && grid1[index + 1 - gridWidth] != WATER && grid2[index + 1 - gridWidth] == NONE {
                            //     grid2[index] = grid1[index + 1 - gridWidth];
                            //     grid2[index + 1 - gridWidth] = WATER;
                            //     return;
                            // }
                            // else
                            if grid2[index + 1] == NONE {
                                grid2[index] = grid1[index + 1];
                                grid2[index + 1] = WATER;
                                return;
                            }
                        }
                        // if pixel.x != 0 && isFluid(grid1[index - 1]) && grid1[index - 1] != WATER {
                        //     if isFluid(grid1[index - 1 - gridWidth]) && grid1[index - 1 - gridWidth] != WATER && grid2[index - 1 - gridWidth] == NONE {
                        //         grid2[index] = grid1[index - 1 - gridWidth];
                        //         grid2[index - 1 - gridWidth] = WATER;
                        //         return;
                        //     }
                        //     else if grid2[index - 1] == NONE {
                        //         grid2[index] = grid1[index - 1];
                        //         grid2[index - 1] = WATER;
                        //         return;
                        //     }
                        // }
                    }
                }
            }
        }
        default: {
            // Missing
        }
    }
};

@compute @workgroup_size(8, 8)
fn compute2Main(@builtin(global_invocation_id) pixel: vec3<u32>) {
    let index = pixel.x + pixel.y * gridWidth;
    if grid2[index] != NONE {
        grid1[index] = grid2[index];
        grid2[index] = NONE;
    }
};