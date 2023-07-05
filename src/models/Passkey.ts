export interface ExportedKeyPair {
    privateKey:JsonWebKey;
    publicKey:JsonWebKey;
}

export interface ImportedKeyPair {
    privateKey:CryptoKey;
    publicKey:CryptoKey;
}
