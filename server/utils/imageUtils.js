const sharp = require('sharp');

const resizeAndSaveJpeg = (buffer, outputPath, width, height) =>
  sharp(buffer).resize(width, height).jpeg({ quality: 90 }).toFile(outputPath);

module.exports = { resizeAndSaveJpeg };
