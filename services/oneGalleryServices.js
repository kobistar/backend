const path = require('path');
const fs = require('fs');
const jsonPath = path.join(__dirname, '../database/GalleryDB.json');

function parseData() {
    existFile();
    let data;
    
    try {
        data = fs.readFileSync(jsonPath, 'utf-8');
    } catch (err) {
        console.error(err);
        throw err;
    }

    return JSON.parse(data)
}

function saveData(updatedData) {
  try {
    fs.writeFileSync(jsonPath, updatedData, 'utf-8');
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function existFile() {
  if (!fs.existsSync(jsonPath)) {
    try {
      fs.writeFileSync(jsonPath, JSON.stringify({ galleries: [] }));
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

module.exports = { parseData, saveData };
