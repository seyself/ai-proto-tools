import fs from 'fs';
import path from 'path';

export const writeAudioBuffer = async (filePath: string, buffer: Buffer): Promise<boolean> => {
  try {
    const speechFile = path.resolve(filePath);
    await fs.promises.writeFile(speechFile, buffer);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
