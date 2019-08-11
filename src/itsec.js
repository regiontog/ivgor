import nacl from "tweetnacl";

const key = nacl.box.keyPair();

export function getSpotifyToken(url, publicKey, signature) {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const body = new FormData();
    body.append('nonce', new Blob([nonce], { type: 'application/octet-stream' }));
    body.append('pass', new Blob([nacl.box(signature, nonce, publicKey, key.secretKey)], { type: 'application/octet-stream' }));
    body.append('publicKey', new Blob([key.publicKey], { type: 'application/octet-stream' }));

    return fetch(url, {
        method: "POST",
        body: body,
    });
}