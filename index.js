const app=require("express")()
const cors=require("cors")
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

app.listen(3000,()=>{console.log("Listeing on 3000")})