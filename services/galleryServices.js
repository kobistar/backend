const path = require('path')
const fs = require('fs')
const jsonPath = path.join(__dirname, '../database/GalleryDB.json')
function parseData(callback) {

    existFile()
    fs.readFile(jsonPath, 'utf-8', (err, data) => {
        if (err) {
            console.error(err)
            callback(err)
            return
        }
        
        let jsonData
        if (data.length > 0) jsonData = JSON.parse(data)
        else jsonData = { galleries: [] }
        callback(null, jsonData)
    })
}

function saveData(updatedData, callback){
    
    fs.writeFile(jsonPath, updatedData, 'utf-8', (err) => {
        if (err) {
            console.error(err)
            callback(err)
            return
        }
        callback(null)
  })
}


function existFile(){
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify({ galleries: [] }))
}

module.exports = { parseData, saveData}
