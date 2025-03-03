const express = require("express")
const app = express()

const { JSDOM } = require('jsdom')


async function fetchCNE(nacionalidad, cedula, debug = false) {
  const url = `http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=${nacionalidad.toUpperCase()}&cedula=${cedula}`
  try {
    if (debug) console.log(`Consultando ${nacionalidad}-${cedula}`)
    const resp = await fetch(url, { headers: { "Access-Control-Allow-Origin": "*" } })
    if (debug) console.log("Recibida respuesta")
    const htmlText = await resp.text()
    if (debug) console.log("Procesando texto")
    //const html = await resp.text()
    const document = (new JSDOM(htmlText)).window.document
    //const element = document.createElement("div")
    //element.innerHTML = resp.data
    const data = {
      cedula: "body > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(2)",
      nombre: "body > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(2) > td:nth-child(2) > b",
      estado: "body > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(2)",
      municipio: "body > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(4) > td:nth-child(2)",
      parroquia: "body > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(5) > td:nth-child(2)",
      centro: "body > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(6) > td:nth-child(2) > font",
      direccion: "body > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(7) > td:nth-child(2) > font"
    };

    (Object.keys(data)).map(sel => {
      if (!sel) return
      let query = data[sel] || " "
      data[sel] = document.querySelector(query)?.innerHTML || ""
    })
    return data
  }
  catch (error) {
    console.error(error)
    return null
  }
}

app.get("/", (req, res) => {
  res.status(200).send("ok")
})

app.get("/:username", async (req, res) => {
  let { username } = req.params
  // https://api.freecodecamp.org/api/users/get-public-profile?username=keinny25
  try {
    let resp = await fetch("https://api.freecodecamp.org/api/users/get-public-profile?username=" + username)
    let data = await resp.json()
    return res.status(200).send(data)
  } catch (error) {
    return res.status(401).send(error)
  }
})

app.get("/cnedata/:nacionalidad/:cedula", async (req, res) => {
  let { nacionalidad, cedula } = req.params
  const data = await fetchCNE(nacionalidad, cedula)
  if (data) {
    return res.status(200).send(data)
  }
  return res.status(400).send("Error")
})

app.post("/cnedata", async (req, res) => {
  let data = req.body

  const { google } = require('googleapis');

  const googleConfig = {
    keyFilename: 'googleKey.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  }
  if (process.env.NODE_ENV == "production") googleConfig.keyFilename = "/etc/secrets/googleKey.json"
  const auth = new google.auth.GoogleAuth(googleConfig);

  //const client = auth.getClient();
  const sheetsApp = google.sheets({ version: 'v4', auth });

  let requests = data.map(row => fetchCNE("V", row.cedula))
  let responses = await Promise.all(requests)
  let rowdata = data.map((row, i) => ({
      range: `${process.env.SHEET}!C${row.row}:F${row.row}`, // Correct range format
      values: [
        [responses[i].nombre, responses[i].municipio, responses[i].parroquia, responses[i].centro]
      ]
  }));

  //let updateCells = { valueInputOption: "RAW", data: rowdata }
  const batchUpdateRequest = {
    spreadsheetId: process.env.SPREADSHEET,
    "resource": {
    "valueInputOption": "RAW",
    "data": rowdata
  }
  };

  console.log(JSON.stringify(batchUpdateRequest))
  try {
    const response = await sheetsApp.spreadsheets.values.batchUpdate(batchUpdateRequest);
    console.log(`Updated ${response.data.totalUpdatedCells} cells.`);
    return res.status(200).send(`Updated ${response.data.totalUpdatedCells} cells.`)
  } catch (err) {
    console.error('Error updating cells:', err);
    return res.status(400).send("error")
  }
})

module.exports = app