const fs = require('fs');
const util = require('util');

const unlinkAsync = util.promisify(fs.unlink);

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

module.exports = { safeUnlink, deleteFiles };
