const renderShader = await(await fetch("./renderShader.wgsl")).text();
const computeShader = await(await fetch("./computeShader.wgsl")).text();

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

const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");

let tick = new Uint32Array(0);
const tickBuffer = device.createBuffer({
	label: "Tick",
	size: 8,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(tickBuffer, 0, tick);

const gridSize = new Float32Array([10, 10]);
const gridSizeBuffer = device.createBuffer({
	label: "Grid Size",
	size: gridSize.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(gridSizeBuffer, 0, gridSize);

const grid = new Uint32Array(gridSize[0] * gridSize[1]);

for (let i = 0; i < gridSize[0] * gridSize[1]; i++) {
	if (Math.random() < 0.5) {
		grid[i] = 2;
	}
	// grid[i] = Math.floor(Math.random() * 3);
}
// for (let i = 50; i < gridSize[0] * gridSize[1]; i++) {
// 	grid[i] = 2;
// }
// grid[50] = 2;
// grid[60] = 2;
// grid[70] = 2;
// for (let i = 0; i < 10; i++) {
// 	grid[i] = 2;
// }
// grid[50] = 1;
// grid[60] = 1;
// grid[61] = 1;
let sand = 0;
for (let i = 0; i < gridSize[0] * gridSize[1]; i++) {
	if (grid[i] == 2) {
		sand++;
	}
}
console.log(sand)

const gridBuffers = [
	device.createBuffer({
		label: "Grid 1",
		size: grid.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	}),
	device.createBuffer({
		label: "Grid 2",
		size: grid.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	}),
];
// const grid1Buffer = device.createBuffer({
// 	label: "Grid 1",
// 	size: grid.byteLength,
// 	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
// });
// for (let i = 0; i < gridSize[0] * gridSize[1]; i++) {
// 	grid[i] = Math.round(Math.random());
// }
device.queue.writeBuffer(gridBuffers[0], 0, grid);
for (let i = 0; i < gridSize[0] * gridSize[1]; i++) {
	grid[i] = 255;
}
device.queue.writeBuffer(gridBuffers[1], 0, grid);

// const grid2Buffer = device.createBuffer({
// 	label: "Grid 2",
// 	size: grid.byteLength,
// 	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
// });
// device.queue.writeBuffer(grid2Buffer, 0, grid);

const vertices = new Float32Array([
	0, 0,
	1, 0,
	0, 1,
	1, 0,
	0, 1,
	1, 1,
]);
const vertexBuffer = device.createBuffer({
    label: "Vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);

const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
		format: "float32x2",
		offset: 0,
		shaderLocation: 0,
    }],
};

const renderShaderModule = device.createShaderModule({
	label: "Render Shader",
	code: renderShader,
});
const renderBindGroupLayout = device.createBindGroupLayout({
	label: "Render Bind Group Layout",
	entries: [{
		binding: 0,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		buffer: {},
	}, {
		binding: 1,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		buffer: {},
	}, {
		binding: 2,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		buffer: { type: "read-only-storage" },
	}],
});
const renderBindGroup = device.createBindGroup({
	label: "Render Bind Group",
	layout: renderBindGroupLayout,
	entries: [{
		binding: 0,
		resource: { buffer: tickBuffer },
	}, {
		binding: 1,
		resource: { buffer: gridSizeBuffer },
	}, {
		binding: 2,
		resource: { buffer: gridBuffers[0] },
	}],
});
const renderPipelineLayout = device.createPipelineLayout({
	label: "Render Pipeline Layout",
	bindGroupLayouts: [renderBindGroupLayout],
});
const renderPipeline = device.createRenderPipeline({
	label: "Render Pipeline",
	layout: renderPipelineLayout,
	vertex: {
		module: renderShaderModule,
		entryPoint: "vertexMain",
		buffers: [vertexBufferLayout],
	},
	fragment: {
		module: renderShaderModule,
		entryPoint: "fragmentMain",
		targets: [{
			format: canvasFormat,
		}],
	},
});

const WORKGROUP_SIZE = 5;
const computeShaderModule = device.createShaderModule({
	label: "Compute Shader",
	code: computeShader,
});
const computeBindGroupLayout = device.createBindGroupLayout({
	label: "Compute Bind Group Layout",
	entries: [{
		binding: 0,
		visibility: GPUShaderStage.COMPUTE,
		buffer: {},
	}, {
		binding: 1,
		visibility: GPUShaderStage.COMPUTE,
		buffer: {},
	}, {
		binding: 2,
		visibility: GPUShaderStage.COMPUTE,
		buffer: { type: "storage" },
	}, {
		binding: 3,
		visibility: GPUShaderStage.COMPUTE,
		buffer: { type: "storage" },
	}],
});
const computeBindGroup = device.createBindGroup({
	label: "Compute Bind Group",
	layout: computeBindGroupLayout,
	entries: [{
		binding: 0,
		resource: { buffer: tickBuffer },
	}, {
		binding: 1,
		resource: { buffer: gridSizeBuffer },
	}, {
		binding: 2,
		resource: { buffer: gridBuffers[0] },
	}, {
		binding: 3,
		resource: { buffer: gridBuffers[1] },
	}],
});
const computePipelineLayout = device.createPipelineLayout({
	label: "Compute Pipeline Layout",
	bindGroupLayouts: [computeBindGroupLayout],
});
const computePipelines = [
	device.createComputePipeline({
		label: "Compute Pipeline 1",
		layout: computePipelineLayout,
		compute: {
			module: computeShaderModule,
			entryPoint: "compute1Main",
		},
	}),
	device.createComputePipeline({
		label: "Compute Pipeline 2",
		layout: computePipelineLayout,
		compute: {
			module: computeShaderModule,
			entryPoint: "compute2Main",
		},
	}),
];

let tickEndTimes = [];

let fpsTimes = [];
let fps = 0;
let minFps = 0;
let maxFps = 0;
let averageFps = 0;

let lastFrame = performance.now();
let frameTimes = [];
let frameTime = 0;
let minFrameTime = 0;
let maxFrameTime = 0;
let averageFrameTime = 0;

let tickTimes = [];
let tickTime = 0;
let minTickTime = 0;
let maxTickTime = 0;
let averageTickTime = 0;

let computeTimes = [];
let computeTime = 0;
let minComputeTime = 0;
let maxComputeTime = 0;
let averageComputeTime = 0;

let renderTimes = [];
let renderTime = 0;
let minRenderTime = 0;
let maxRenderTime = 0;
let averageRenderTime = 0;

const timingGradient = overlayCtx.createLinearGradient(0, 106, 0, 204);
timingGradient.addColorStop(0, "#ff00ff");
timingGradient.addColorStop(0.1, "#ff0000");
timingGradient.addColorStop(0.25, "#ff0000");
timingGradient.addColorStop(0.4, "#ffff00");
timingGradient.addColorStop(0.7, "#00ff00");
timingGradient.addColorStop(1, "#00ff00");

let debug = false;

document.addEventListener("keydown", function(event) {
	if (event.key.toLowerCase() == "z" && event.altKey) {
		debug = !debug;
	}
});

var updateTimes = function(times, time) {
	times.push(time);
	while (times.length > 100) {
		times.shift();
	}
	let minTime = times[0];
	let maxTime = times[0];
	let averageTime = times[0];
	for (let i = 1; i < times.length; i++) {
		if (minTime > times[i]) {
			minTime = times[i];
		}
		if (maxTime < times[i]) {
			maxTime = times[i];
		}
		averageTime += times[i];
	}
	averageTime /= times.length;
	return [times, time, minTime, maxTime, averageTime];
};

var update = function() {
	let totalStart = performance.now();

	const encoder = device.createCommandEncoder();
	
	let computeStart = performance.now();

	const computePass = encoder.beginComputePass();

	computePass.setBindGroup(0, computeBindGroup);
	computePass.setPipeline(computePipelines[0]);

	computePass.dispatchWorkgroups(Math.ceil(gridSize[0] / WORKGROUP_SIZE), Math.ceil(gridSize[1] / WORKGROUP_SIZE));

	computePass.setPipeline(computePipelines[1]);

	computePass.dispatchWorkgroups(Math.ceil(gridSize[0] / WORKGROUP_SIZE), Math.ceil(gridSize[1] / WORKGROUP_SIZE));
	// computePass.dispatchWorkgroups(Math.ceil(gridSize[0] * gridSize[1] / WORKGROUP_SIZE));

	computePass.end();

	tick[0] += 1;
	device.queue.writeBuffer(tickBuffer, 0, tick);

	let computeEnd = performance.now();

	let renderStart = performance.now();

	const renderPass = encoder.beginRenderPass({
		colorAttachments: [{
			view: ctx.getCurrentTexture().createView(),
			loadOp: "clear",
			clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
			storeOp: "store",
		}]
	});

	renderPass.setBindGroup(0, renderBindGroup);
	renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);

	// renderPass.draw(totalVertices, gridSize[0] * gridSize[1]);
    renderPass.draw(vertices.length / 2, gridSize[0] * gridSize[1]);
    // renderPass.draw(vertices.length / 2, 1);

	renderPass.end();

	let renderEnd = performance.now();

	device.queue.submit([encoder.finish()]);
	
	let totalEnd = performance.now();
	
	tickEndTimes.push(totalEnd);
	while (totalEnd - tickEndTimes[0] > 1000) {
		tickEndTimes.shift();
	}

	[fpsTimes, fps, minFps, maxFps, averageFps] = updateTimes(fpsTimes, tickEndTimes.length);
	[frameTimes, frameTime, minFrameTime, maxFrameTime, averageFrameTime] = updateTimes(frameTimes, performance.now() - lastFrame);
	[tickTimes, tickTime, minTickTime, maxTickTime, averageTickTime] = updateTimes(tickTimes, totalEnd - totalStart);
	[computeTimes, computeTime, minComputeTime, maxComputeTime, averageComputeTime] = updateTimes(computeTimes, computeEnd - computeStart);
	[renderTimes, renderTime, minRenderTime, maxRenderTime, averageRenderTime] = updateTimes(renderTimes, renderEnd - renderStart);
	
	lastFrame = performance.now();

	overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
	if (debug) {
		let fpsText = "FPS: " + fps + "; Min: " + minFps + "; Max: " + maxFps + "; Avg: " + averageFps.toFixed(2) + ";";
		let frameText = "Frame: " + frameTime.toFixed(2) + "ms; Min: " + minFrameTime.toFixed(2) + "ms; Max: " + maxFrameTime.toFixed(2) + "ms; Avg: " + averageFrameTime.toFixed(2) + "ms;";
		let tickText = "Tick: " + tickTime.toFixed(2) + "ms; Min: " + minTickTime.toFixed(2) + "ms; Max: " + maxTickTime.toFixed(2) + "ms; Avg: " + averageTickTime.toFixed(2) + "ms;";
		let computeText = "Compute: " + computeTime.toFixed(2) + "ms; Min: " + minComputeTime.toFixed(2) + "ms; Max: " + maxComputeTime.toFixed(2) + "ms; Avg: " + averageComputeTime.toFixed(2) + "ms;";
		let renderText = "Render: " + renderTime.toFixed(2) + "ms; Min: " + minRenderTime.toFixed(2) + "ms; Max: " + maxRenderTime.toFixed(2) + "ms; Avg: " + averageRenderTime.toFixed(2) + "ms;";

		overlayCtx.fillStyle = "#ffffff55";
		overlayCtx.fillRect(1, 0, overlayCtx.measureText(fpsText).width + 4, 20);
		overlayCtx.fillRect(1, 21, overlayCtx.measureText(frameText).width + 4, 20);
		overlayCtx.fillRect(1, 42, overlayCtx.measureText(tickText).width + 4, 20);
		overlayCtx.fillRect(1, 63, overlayCtx.measureText(computeText).width + 4, 20);
		overlayCtx.fillRect(1, 84, overlayCtx.measureText(renderText).width + 4, 20);

		overlayCtx.font = "20px Source Code Pro";
		overlayCtx.textBaseline = "top";
		overlayCtx.textAlign = "left";
		overlayCtx.fillStyle = "#000000";
		overlayCtx.fillText(fpsText, 3, 1);
		overlayCtx.fillText(frameText, 3, 22);
		overlayCtx.fillText(tickText, 3, 43);
		overlayCtx.fillText(computeText, 3, 64);
		overlayCtx.fillText(renderText, 3, 85);

		overlayCtx.fillStyle = "#7f7f7f7f";
        overlayCtx.fillRect(5, 105, 300, 100);

        overlayCtx.strokeStyle = timingGradient;
        overlayCtx.lineJoin = "bevel";
        overlayCtx.lineCap = "butt";
        overlayCtx.lineWidth = 3;
        overlayCtx.setLineDash([]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(5, Math.max(106, 204 - frameTimes[0] * 2));
        for (let i = 1; i < frameTimes.length; i++) {
            overlayCtx.lineTo(5 + i * 3, Math.max(106, 204 - frameTimes[i] * 2));
        }
        overlayCtx.stroke();
		overlayCtx.lineWidth = 2;
        overlayCtx.beginPath();
        overlayCtx.moveTo(5, Math.max(106, 204 - tickTimes[0] * 2));
        for (let i = 1; i < tickTimes.length; i++) {
            overlayCtx.lineTo(5 + i * 3, Math.max(106, 204 - tickTimes[i] * 2));
        }
        overlayCtx.stroke();
		overlayCtx.lineWidth = 1;
        overlayCtx.beginPath();
        overlayCtx.moveTo(5, Math.max(106, 204 - computeTimes[0] * 2));
        for (let i = 1; i < computeTimes.length; i++) {
            overlayCtx.lineTo(5 + i * 3, Math.max(106, 204 - computeTimes[i] * 2));
        }
        overlayCtx.moveTo(5, Math.max(106, 204 - renderTimes[0] * 2));
        for (let i = 1; i < renderTimes.length; i++) {
            overlayCtx.lineTo(5 + i * 3, Math.max(106, 204 - renderTimes[i] * 2));
        }
        overlayCtx.stroke();

        overlayCtx.strokeStyle = "#555555";
        overlayCtx.lineWidth = 2;
        overlayCtx.setLineDash([6, 6]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(8, 204 - 1000 / 60 * 2);
        overlayCtx.lineTo(302, 204 - 1000 / 60 * 2);
        overlayCtx.moveTo(8, 204 - 1000 / 30 * 2);
        overlayCtx.lineTo(302, 204 - 1000 / 30 * 2);
        overlayCtx.stroke();

		overlayCtx.fillStyle = "#000000";
		overlayCtx.fillText("60 FPS", 8, 204 - 1000 / 60 * 2 - 21);
		overlayCtx.fillText("30 FPS", 8, 204 - 1000 / 30 * 2 - 21);
	}
	
	// window.requestAnimationFrame(update);
};
// window.requestAnimationFrame(update);
setInterval(update, 1000);