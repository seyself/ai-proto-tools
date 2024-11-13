/**
 * 画像ファイルをBase64文字列に変換する
 * @param filePath - 変換する画像ファイルのパス
 * @returns Promise<string> - Base64エンコードされた画像データ
 * @throws Error - ファイルの読み込みに失敗した場合
 */
export declare const readFileToBase64: (filePath: string) => Promise<{
    data: Buffer;
    base64: string;
    mimeType: string;
    fileName: string | undefined;
    length: number;
}>;
//# sourceMappingURL=readFileToBase64.d.ts.map