import { Base64 } from "js-base64";
import { rgb2hsl, to_css, linear } from "/src/color";
import { getSpotifyToken, encode } from "/src/itsec";

const params = new URLSearchParams(window.location.search);

const apiKey = encode(Base64.decode(params.get("pass")));
const publicKey = encode(Base64.decode(params.get("publicKey")));

const canvas = document.createElement("canvas");
const offscreenImage = document.createElement("img");
offscreenImage.crossOrigin = "anonymous";
const canvasCtx = canvas.getContext("2d");

function getImageData(url) {
    return new Promise(resolve => {
        const loaded = () => {
            offscreenImage.removeEventListener("load", loaded);

            canvas.width = offscreenImage.width;
            canvas.height = offscreenImage.height;

            canvasCtx.drawImage(offscreenImage, 0, 0);
            resolve(canvasCtx.getImageData(0, 0, canvas.width, canvas.height));
        };

        offscreenImage.addEventListener("load", loaded);
        offscreenImage.src = url;
    });
}

const colorSwitcher = new Worker("imgcolor.worker.js");
const colors = {};

function getColor(url) {
    return new Promise((resolve) => {
        let color = colors[url];

        if (!color) {
            const recv = ({ data }) => {
                if (data.url === url) {
                    colorSwitcher.removeEventListener("message", recv);

                    colors[url] = data.color;
                    resolve(data.color);
                }
            };

            colorSwitcher.addEventListener("message", recv);

            getImageData(url).then(imageData => {
                colorSwitcher.postMessage({
                    url,
                    numPixels: imageData.width * imageData.height,
                    imageBuffer: imageData.data.buffer
                }, [imageData.data.buffer]);
            });
        } else {
            resolve(color);
        }
    });
}

const image = document.querySelector("img");
let targetColor;
let currentColor = rgb2hsl(0, 0, 0);
let cancelColorTransition;
const songName = document.querySelector(".song-name");
const artistName = document.querySelector(".artist-name");
const container = document.querySelector(".container");

let songTimeout;

function updateElement(element, content) {
    const span = element.children[0];

    if (span.innerHTML !== content) {
        span.innerHTML = content;
        span.style["animation-duration"] = (span.clientWidth / 15) + "s";

        while (element.children.length > 1) {
            element.removeChild(element.lastChild);
        }

        element.removeAttribute("overflowing");

        if (element.scrollWidth > element.clientWidth) {
            element.setAttribute("overflowing", "");
            element.appendChild(span.cloneNode(true));
        }
    }
}

function a200(res) {
    if (res.status !== 200) {
        throw res;
    }

    return res;
}

function update() {
    getSpotifyToken("http://localhost:8888/", publicKey, apiKey)
        .then(a200)
        .then(res => res.text())
        .then(token => fetch("https://api.spotify.com/v1/me/player/currently-playing",
            {
                headers: {
                    "Authorization": "Bearer " + token,
                },
            }))
        .then(a200)
        .then(res => res.json())
        .then(json => {
            image.src = json.item.album.images[0].url;

            getColor(image.src).then(color => {
                if (color) {
                    const newColor = rgb2hsl(color[0], color[1], color[2]);

                    if (newColor != targetColor) {
                        targetColor = newColor;

                        if (cancelColorTransition) {
                            cancelColorTransition();
                        }

                        cancelColorTransition = linear(currentColor, newColor, 3, color => {
                            const alpha = to_css(color);
                            container.style["background"] = `linear-gradient(90deg, ${alpha(1)} 100px, ${alpha(0.5)} 85%, rgba(0, 0, 0, 0))`;
                            currentColor = color;
                        });
                    }
                }
            });

            updateElement(songName, json.item.name);
            updateElement(artistName, json.item.artists.map(artist => artist.name).join(", "));

            const timeToNextSong = json.item.duration_ms - json.progress_ms;

            if (songTimeout) {
                clearTimeout(songTimeout);
            }

            songTimeout = setTimeout(update, timeToNextSong);
        })
        .catch(console.error);
}

setInterval(update, 1000);
update();