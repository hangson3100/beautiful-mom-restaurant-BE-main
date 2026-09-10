const app = require("./src/app");

const { createServer } = require("http");
const { Server } = require("socket.io");
const { CONFIG } = require("./src/config");

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, { 
    cors: {
        credentials: true,
        origin: CONFIG.FRONTEND_DOMAIN,
        methods: ["GET", "POST"],
    }
});

app.set("io", io);

io.on("connection", (socket)=>{
    console.log(socket.id);
    socket.on("new_order_backend", (payload)=>{
        console.log(payload);
        socket.broadcast.emit("new_order", payload);
    })

    socket.on("order_update_backend", (payload)=>{
        console.log(payload);
        socket.broadcast.emit("order_update", payload);
    })
});

httpServer.listen(PORT);

// app.listen(PORT, ()=>{
//     console.log(`Server Started on PORT: ${PORT}`);
// });