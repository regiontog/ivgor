import nacl from "tweetnacl";

const key = nacl.box.keyPair();

export function encode(data) {
    const uint16view = new Uint16Array(data.length);

    for (let i = 0; i < data.length; i++) {
        uint16view[i] = data.charCodeAt(i);
    }

    return new Uint8Array(uint16view.buffer);
}

export function getSpotifyToken(url, publicKey, pass) {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const boxed = nacl.box(pass, nonce, publicKey, key.secretKey);

    const body = new FormData();
    body.append('nonce', new Blob([nonce], { type: 'application/octet-stream' }));
    body.append('pass', new Blob([boxed], { type: 'application/octet-stream' }));
    body.append('publicKey', new Blob([key.publicKey], { type: 'application/octet-stream' }));

    return fetch(url, {
        method: "POST",
        body: body,
    });
}