import {Server} from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin: ["http://localhost:5173"]
    }
})

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {} // {userId: socketId}

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    const userId = socket.handshake.query.userId
    if(userId) userSocketMap[userId] = socket.id

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("typing", ({ receiverId, isTyping }) => {
        console.log(`User ${userId} is ${isTyping ? 'typing' : 'stopped typing'} to ${receiverId}`);
        
        const receiverSocketId = getReceiverSocketId(receiverId);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", {
                userId: userId,
                isTyping: isTyping
            });
        }
    });

    // Handle sending messages - this should be called when a message is sent
    socket.on("sendMessage", (messageData) => {
        console.log("Message sent:", messageData);
        
        const receiverSocketId = getReceiverSocketId(messageData.receiverId);
        
        if (receiverSocketId) {
            // Send message to specific receiver
            io.to(receiverSocketId).emit("newMessage", messageData);
        }
        
        // Also send back to sender for confirmation
        socket.emit("messageConfirmed", messageData);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

export { io, app, server };