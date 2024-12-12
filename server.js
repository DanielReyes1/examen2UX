//librerias
require('dotenv').config(); //para obtener info del env
const express = require('express');
const path = require('path'); //ayuda a enviar archivos
const bodyParser = require('body-parser');//tipo de parser
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut }= require("firebase/auth");
const { initializeApp } = require('firebase/app');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//instancias
const app = express();
let parser= bodyParser.urlencoded({extended:true});
let uri = process.env.MONGO_URI;
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: "examen2ux-65501.firebaseapp.com",
    projectId: "examen2ux-65501",
    storageBucket: "examen2ux-65501.firebasestorage.app",
    messagingSenderId: "1062952665916",
    appId: "1:1062952665916:web:c2e1baa319a4bac30b5439"
  };
const app_firebase = initializeApp(firebaseConfig);

//configuraciones
app.use(parser);
const port = 3000;
const client= new MongoClient(uri,{ //conectarse a mongo
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
});

//funciones
async function connect() {
    try {
        await client.connect();
        console.log("Conectado a la base de datos");
    } catch (error) {
        console.error("Error al conectar a la base de datos: ", error);
    }
}

//iniciar
app.listen(port,()=>{
    console.log(`Servidor corriendo en http://localhost:${port}`);
    connect();
});

//endpoints
app.post('/createUser',async(req,res)=>{
    const auth= getAuth();
    createUserWithEmailAndPassword(auth,req.body.correo,req.body.contrasena)
    .then((response)=>{
        res.status(200).send({
            resultado:response,
        });
    }).catch((error)=>{
        res.status(400).send({
            error:error
        });
    });
});

app.post('/logIn', async(req,res)=>{
    const auth= getAuth(app_firebase);
    signInWithEmailAndPassword(auth,req.body.correo,req.body.contrasena)
    .then((response)=>{
        res.status(200).send({
            resultado: response
        });
    }).catch((error)=>{
        res.status(400).send({
            error:error
        });
    });
});

app.post('/logOut', async(req,res)=>{
    const auth = getAuth(app_firebase);
    signOut(auth).then((response)=>{
        res.status(200).send({
            mensaje: `La sesion del usuario fue cerrada`,
            resultado: response
        });
    }).catch((error)=>{
        res.status(400).send({
            mensaje: "No hay ningun usuario que esta logged In",
            error: error
        });
    });
});


app.post('/createPost', async(req,res)=>{
    try{
        const response= await new MongoClient(uri).db("examen2").collection("Post").insertOne({
            nombre: req.body.nombre,
            apellido:  req.body.apellido,
            ...req.body
        });
        res.status(200).send({
            mensaje: "Se ha insertado un documento",
            resultado:response
        });
    }catch(error){
        res.status(401).send({
            mensaje: "No se pudo insertar el documento",
            error: error.message
        })
    }
});

app.get('/listPost', async(req,res)=>{
    try{
        const response= await new MongoClient(uri).db("examen2").collection("Post").find({}).toArray();
        res.status(201).send({
            mensaje: "Se han obtenido todos los documentos",
            resultado: response
        });
    }catch(error){
        res.status(401).send({
            mensaje: "No se pudieron obtener los documentos",
            error:error.message
        });
    }
});

app.put('/editPost/:id', async(req,res)=>{
    try{
        const response= await new MongoClient(uri).db("examen2").collection("Post").updateOne(
            {
                _id: new ObjectId(req.params.id)
            },
            {
                $set:{
                    ...req.body,
                    modificado: true
                }
            }
    );
    res.status(200).send({
        mensaje: "Se ha modificado exitosamente",
        resultado: response
    });
    }catch(error){
        res.status(401).send({
            mensaje: "No se pudo modificar",
            error:error.message
        });
    }
});

app.delete('/deletePost/:id',async(req,res)=>{
    try{
        const response= await new MongoClient(uri).db("examen2").collection("Post").deleteOne(
            {
                _id: new ObjectId(req.params.id)       
            }
        );
        if(response.deletedCount === 0){
            res.status(300).send({
                mensaje: `No se encontro el documento con el id: ${req.params.id}`
            })
        }
        res.status(200).send({
            mensaje:`Se ha eliminado el id: ${req.params.id}`,
            resultado: response
        })
    }catch(error){
        res.status(401).send({
            mensaje:`No se pudo borrar el id: ${req.params.id}`,
            error:error.message
        })
    }
});