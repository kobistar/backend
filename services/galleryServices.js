const path = require('path')
const fs = require('fs')
const jsonPath = path.join(__dirname, '../database/GalleryDB.json')

function parseData() {
    existFile()
    try {
      const data = fs.readFileSync(jsonPath, 'utf-8')
      let jsonData = { galleries: [] }
      
      if (data.length > 0) return JSON.parse(data)
      else return jsonData 
      
    } catch (err) {
      throw err
    }
  }
  

function saveData(updatedData) {
    try {
        fs.writeFileSync(jsonPath, updatedData, 'utf-8');
    } 
    catch (err) {
        throw err;
    }
}
  


function existFile(){
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify({ galleries: [] }))
}

module.exports = { parseData, saveData}
