import quantize from "quantize";
import { rgb2hsl } from "/src/color";

onmessage = function (message) {
    const imageData = new Uint8ClampedArray(message.data.imageBuffer);

    const pixels = [];

    for (let i = 0; i < message.data.numPixels; i += 4) {
        const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
        const { l, s } = rgb2hsl(r, g, b);

        if (0.1 < l && l < 0.9 && s > 0.1) {
            pixels.push([r, g, b]);
        }
    }

    const cmap = quantize(pixels, 5);

    self.postMessage({
        color: cmap ? cmap.palette()[0] : [0, 0, 0],
        url: message.data.url,
    });
}