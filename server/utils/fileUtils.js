const path = require('path');
const fs = require('fs');
const util = require('util');

const unlinkAsync = util.promisify(fs.unlink);

const resolveChildPath = (directory, fileName) => {
  if (
    typeof fileName !== 'string' ||
    !fileName ||
    fileName === '.' ||
    fileName === '..' ||
    fileName.includes('/') ||
    fileName.includes('\\')
  ) {
    throw new Error('Invalid file name');
  }

  const resolvedDirectory = path.resolve(directory);
  const resolvedPath = path.resolve(resolvedDirectory, fileName);
  const relativePath = path.relative(resolvedDirectory, resolvedPath);

  if (
    !relativePath ||
    relativePath.startsWith(`..${path.sep}`) ||
    relativePath === '..' ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error('File path must be inside the target directory');
  }

  return resolvedPath;
};

const safeUnlink = async (filePath) => {
  if (!filePath) return;
  try {
    await unlinkAsync(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
};

const deleteFiles = async (filePaths) => {
  if (!Array.isArray(filePaths) || filePaths.length === 0) return;

  await Promise.all(
    filePaths.map(async (filePath) => {
      if (filePath) {
        await safeUnlink(filePath);
      }
    })
  );
};

module.exports = { safeUnlink, deleteFiles, resolveChildPath };
