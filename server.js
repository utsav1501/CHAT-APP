//Install what we have installed
import express from "express";
import {Server} from "socket.io";
import cors from "cors";
import http from "http"; 
import { connect } from "./config.js";
import { chatModel } from "./chat.schems.js";

const app=express();//it creates an object express application object and assigned to app
// 1. Create server using http
const server=http.createServer(app);//socket server uses it to start the communication

// 2.Create socket server
const io=new Server(server,{//socket server needs http server to start the communication
    cors:{
        origin:'*',
        methods:["GET","POST"]//means from all the origin we are going to allow only get and post method
    }
});

// 3. Use socket events.

io.on('connection',(socket)=>{//io takes name of connection and do steps accordingly
    console.log("Connection is established");
    socket.on("join",(data)=>{
        socket.username=data;

        //send old message to the client
        chatModel.find().sort({timestamp:1}).limit(50)//show only 50 msges
            .then(messages=>{
                socket.emit('load_messages',messages)
            }).catch(err=>{
                console.log(err);
            })
    })
    socket.on('new_message',(message)=>{
        let userMessage={
            username:socket.username,
            message:message
        }
        const newChat=new chatModel({
            username:socket.username,
            message:message,
            timestamp:new Date()
        });
        newChat.save();//it will store the data in the database


        //broadcast this message to all the users
        socket.broadcast.emit('broadcast_message', userMessage); 
    })

    socket.on('disconnect',()=>{
        console.log(`${socket.username} has disconnected.`);
    // You can also notify other clients
    // socket.broadcast.emit('broadcast_message', {
    //     username: 'Server',
    //     message: `${socket.username} has left the chat.`
    // });
    })
});

server.listen(3000,()=>{
    console.log("App is listening on 3000");
    connect();
})