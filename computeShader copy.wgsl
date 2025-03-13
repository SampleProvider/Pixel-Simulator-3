
@group(0) @binding(0) var<uniform> tick: u32;
@group(0) @binding(1) var<storage, read_write> grid1: array<u32>;
@group(0) @binding(2) var<storage, read_write> grid2: array<u32>;

const gridWidth: u32 = GRID_WIDTH;
const gridHeight: u32 = GRID_HEIGHT;

const AIR = 0;
const SAND = 1;
const WATER = 2;

const NONE = NONE;

fn random(number: f32) -> f32 {
    return fract(sin(number) * 43758.5453123);
};

fn isFluid(id: u32) -> bool {
    return id == 0 || id == 2;
};

fn flow(x: u32, y: u32, id: u32, searchDistance: u32, searchHeight: u32, isPassable: fn) {
    let index = x + y * gridWidth;
    if y == 0 {
        return;
    }
    if isPassable(grid1[index - gridWidth] && grid2[index - gridWidth] == NONE {
        grid2[index] = grid1[index - gridWidth];
        grid2[index - gridWidth] = grid1[index];
        return;
    }
    if y < searchHeight {
        return;
    }
    for (i = 1; i <= searchDistance; i++) {

    }
};

@compute @workgroup_size(8, 8)
fn compute1Main(@builtin(global_invocation_id) pixel: vec3<u32>) {
    if pixel.x >= gridWidth || pixel.y >= gridHeight {
        return;
    }
    let index = pixel.x + pixel.y * gridWidth;
    // let index = pixel.x;
    switch grid1[index] {
        case 0: {
            // Air
        }
        case 1: {
            if grid2[index] != NONE {
                return;
            }
            // Sand
            if pixel.y != 0 {
                if isFluid(grid1[index - gridWidth]) && grid2[index - gridWidth] == NONE {
                    grid2[index] = grid1[index - gridWidth];
                    grid2[index - gridWidth] = 1;
                }
                else {
                    if random(f32(tick * gridWidth * gridHeight * index)) < 0.5 {
                        if pixel.x != 0 && isFluid(grid1[index - 1 - gridWidth]) && grid2[index - 1 - gridWidth] == NONE {
                            grid2[index] = grid1[index - 1 - gridWidth];
                            grid2[index - 1 - gridWidth] = 1;
                        }
                    }
                    else {
                        if pixel.x != gridWidth - 1 && isFluid(grid1[index + 1 - gridWidth]) && grid2[index + 1 - gridWidth] == NONE {
                            grid2[index] = grid1[index + 1 - gridWidth];
                            grid2[index + 1 - gridWidth] = 1;
                        }
                    }
                }
            }
        }
        case 2: {
            if grid2[index] != NONE {
                return;
            }
            // Water
            if pixel.y != 0 {
                if isFluid(grid1[index - gridWidth]) && grid1[index - gridWidth] != 2 && grid2[index - gridWidth] == NONE {
                    grid2[index] = grid1[index - gridWidth];
                    grid2[index - gridWidth] = 2;
                }
                else if pixel.x != 0 && isFluid(grid1[index - 1 - gridWidth]) && grid1[index - 1 - gridWidth] != 2 && grid2[index - 1 - gridWidth] == NONE {
                    grid2[index] = grid1[index - 1 - gridWidth];
                    grid2[index - 1 - gridWidth] = 2;
                }
                else if pixel.x != gridWidth - 1 && isFluid(grid1[index + 1 - gridWidth]) && grid1[index + 1 - gridWidth] != 2 && grid2[index + 1 - gridWidth] == NONE {
                    grid2[index] = grid1[index + 1 - gridWidth];
                    grid2[index + 1 - gridWidth] = 2;
                }
                else {
                    // var leftSpace = 0;
                    // var rightSpace = 0;
                    // if pixel.x != 0 && isFluid(grid1[index - 1]) && grid1[index - 1] != 2 && grid2[index - 1] == NONE {
                    //     leftSpace = 1;
                    // }
                    // if pixel.x != gridWidth - 1 && isFluid(grid1[index + 1]) && grid1[index + 1] != 2 && grid2[index + 1] == NONE {
                    //     rightSpace = 1;
                    // }
                    // if leftSpace == 1 && rightSpace == 1 {
                    //     grid2[index] = grid1[index - 1];
                    //     grid2[index - 1] = 2;
                    //     // if random(f32(tick) * gridSize.x * gridSize.y + f32(index)) < 0.5 {
                    //     //     grid2[index] = grid1[index - 1];
                    //     //     grid2[index - 1] = 2;
                    //     // }
                    //     // else {
                    //     //     grid2[index] = grid1[index + 1];
                    //     //     grid2[index + 1] = 2;
                    //     // }
                    // }
                    // else if leftSpace == 1 {
                    //     grid2[index] = grid1[index - 1];
                    //     grid2[index - 1] = 2;
                    // }
                    // else if rightSpace == 1 {
                    //     grid2[index] = grid1[index + 1];
                    //     grid2[index + 1] = 2;
                    // }
                    // var leftSpace: u32 = 0;
                    // var rightSpace: u32 = 0;
                    // var oof = i32(pixel.x);
                    // if pixel.x != 0 && grid2[index - 1] == NONE {
                    //     for (var asdf = oof - 1; asdf >= 0; asdf--) {
                    //         if !isFluid(grid1[u32(asdf) + pixel.y * gridWidth]) || grid1[u32(asdf) + pixel.y * gridWidth] == 2 {
                    //             break;
                    //         }
                    //         if isFluid(grid1[u32(asdf) + pixel.y * gridWidth - gridWidth]) && grid1[u32(asdf) + pixel.y * gridWidth - gridWidth] != 2 {
                    //             leftSpace = pixel.x - u32(asdf);
                    //             break;
                    //         }
                    //     }
                    // }
                    // if pixel.x != gridWidth - 1 && grid2[index + 1] == NONE {
                    //     for (var asdf = oof + 1; asdf < i32(gridSize.x); asdf++) {
                    //         if !isFluid(grid1[u32(asdf) + pixel.y * gridWidth]) || grid1[u32(asdf) + pixel.y * gridWidth] == 2 {
                    //             break;
                    //         }
                    //         if isFluid(grid1[u32(asdf) + pixel.y * gridWidth - gridWidth]) && grid1[u32(asdf) + pixel.y * gridWidth - gridWidth] != 2 {
                    //             rightSpace = u32(asdf) - pixel.x;
                    //             break;
                    //         }
                    //     }
                    // }
                    // if leftSpace == 0 {
                    //     rightSpace += 1;
                    // }
                    // // grid2[leftSpace] = 2;
                    // if leftSpace != 0 && rightSpace != 0 {
                    //     if leftSpace == rightSpace {
                    //         // if random(f32(tick) * gridSize.x * gridSize.y + f32(index)) < 0.5 {
                    //         //     grid2[index] = grid1[index - 1];
                    //         //     grid2[index - 1] = 2;
                    //         // }
                    //         // else {
                    //         //     grid2[index] = grid1[index + 1];
                    //         //     grid2[index + 1] = 2;
                    //         // }
                    //     }
                    //     // else if leftSpace < rightSpace {
                    //     //     grid2[index] = grid1[index - 1];
                    //     //     grid2[index - 1] = 2;
                    //     // }
                    //     // else {
                    //     //     grid2[index] = grid1[index + 1];
                    //     //     grid2[index + 1] = 2;
                    //     // }
                    // }
                    // else if leftSpace != 0 {
                    //     // grid2[index] = grid1[index - 1];
                    //     // grid2[index - 1] = 2;
                    // }
                    // else if rightSpace != 0 {
                    //     // grid2[index] = grid1[index + 1];
                    //     // grid2[index + 1] = 2;
                    // }
                }
            }
            return;
        }
        default: {
            return;
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