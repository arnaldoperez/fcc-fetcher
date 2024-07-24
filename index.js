const app=require("express")()
const cors=require("cors")
const {JSDOM} =require('jsdom')
app.use(cors())

app.get("/",(req,res)=>{
    res.status(200).send("ok")
})

app.get("/:username",async (req,res)=>{
    let {username}=req.params
    // https://api.freecodecamp.org/api/users/get-public-profile?username=keinny25
    try {
        let resp=await fetch("https://api.freecodecamp.org/api/users/get-public-profile?username="+username)
        let data=await resp.json()
        return res.status(200).send(data)        
    } catch (error) {
        return res.status(401).send(error)
    }
})

app.get("/cnedata/:nacionalidad/:cedula", async(req,res)=>{
    let {nacionalidad, cedula}=req.params
    const url = `http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=${nacionalidad.toUpperCase()}&cedula=${cedula}`
  try {
    console.log(`Consultando ${nacionalidad}-${cedula}`)
    const resp = await fetch(url, { headers: { "Access-Control-Allow-Origin": "*" } })  
    console.log("Recibida respuesta")  
    const htmlText=await resp.text()
    console.log("Procesando texto")  
    //const html = await resp.text()
    const document=(new JSDOM(htmlText)).window.document
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
  
  (Object.keys(data)).map(sel=>{
    if (!sel) return
    let query=data[sel]||" "
    data[sel]=document.querySelector(query)?.innerHTML||""
  })
  return res.status(200).send(data)
} catch (error) {
    console.error(error)
    return res.status(400).send("Error")
  }
})

app.listen(3000,()=>{console.log("Listeing on 3000")})