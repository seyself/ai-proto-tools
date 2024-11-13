import fs from 'fs';
/**
 * 画像ファイルをBase64文字列に変換する
 * @param filePath - 変換する画像ファイルのパス
 * @returns Promise<string> - Base64エンコードされた画像データ
 * @throws Error - ファイルの読み込みに失敗した場合
 */
export const readFileToBase64 = async (filePath) => {
    try {
        // ファイルを読み込む
        const buffer = await fs.promises.readFile(filePath);
        // ファイルの拡張子を取得して適切なMIMEタイプを決定
        const extension = filePath.split('.').pop()?.toLowerCase() || '';
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'heic': 'image/heic',
            'heif': 'image/heif',
        };
        const mimeType = mimeTypes[extension] || 'image/jpeg';
        // Buffer をBase64文字列に変換
        return {
            data: buffer,
            base64: `data:${mimeType};base64,${buffer.toString('base64')}`,
            mimeType,
            fileName: filePath.split('/').pop(),
            length: buffer.length,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read image file: ${errorMessage}`);
    }
};
