var pixels = [];

var parse = function(string) {
    var lines = string.replaceAll("\t", "").split("\n");
    var pixel = null;
    var currentSection = null;
    var globalInputs = {};
    var globalOutputs = {};
    var pixelInputs = {};
    var pixelOutputs = {};
    var ruleInputs = {};
    var ruleOutputs = {};

    while (lines.length > 0) {
        if (pixel == null) {
            if (lines[0].startsWith("pixel")) {
                pixel = lines[0].substring(6, lines[0].length - 2);
            }
            else if (lines[0].startsWith("input")) {
                var input = lines[0].substring(6, 7);
                var inputPixel = lines[0].substring(10, lines[0].indexOf("("));
                globalInputs[input] = {
                    id: inputPixel,
                };
                var data = lines[0].substring(lines[0].indexOf("(") + 1, lines[0],indexOf(")")).split(",");
                for (var i = 0; i < data.length; i++) {
                    globalInputs[input][lines[0].substring(0, data[i].indexOf("=") - 1)] = lines[0].substring(data[i].indexOf("=") + 1, data[i].length);
                }
            }
            else if (lines[0].startsWith("output")) {
                var output = lines[0].substring(7, 8);
                var outputPixel = lines[0].substring(11, lines[0].indexOf("("));
                globalOutputs[output] = {
                    id: outputPixel,
                };
                var data = lines[0].substring(lines[0].indexOf("(") + 1, lines[0],indexOf(")")).split(",");
                for (var i = 0; i < data.length; i++) {
                    globalOutputs[output][lines[0].substring(0, data[i].indexOf("=") - 1)] = lines[0].substring(data[i].indexOf("=") + 1, data[i].length);
                }
            }
        }
        else if ()
        lines.shift();
    }
    // if we are not in pixel:
    // search for pixel
    //     find: set pixel variable
    //     else:
    // search for input/output
    // set global input/output
};

var getNextWord = function(string, index) {
    var startIndex = -1;
    while (index < string.length) {
        if (string[index] != " " && string[index] != "\t") {
            if (startIndex != -1)
            startIndex = index;
        }
        else if (startIndex != -1) {
            return {
                word: string.substring(startIndex, index),
                index: index,
            };
        }
    }
    return null;
};