import CryptoES from 'crypto-es';
import { IStorageEncryption } from "./lib";
export class AESStorageSecurity implements IStorageEncryption {
    private key: string;
    private iv: CryptoES.lib.WordArray;

    constructor(key: string, iv: string) {
        this.key = key; // 密钥
        this.iv = CryptoES.enc.Hex.parse(iv);
    }
    // AES加密方法
    encrypt(str: string): string {
        return CryptoES.AES.encrypt(str, this.key, { iv: this.iv }).toString();
    }

    // AES解密方法
    decrypt(str: string): string {
        const decrypted = CryptoES.AES.decrypt(str, this.key, { iv: this.iv });
        return decrypted.toString(CryptoES.enc.Utf8);
    }

    encryptKey(str: string): string {
        return CryptoES.MD5(str + this.key).toString()
    }
}
