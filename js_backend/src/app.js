import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET','POST','HEAD','PUT','PATCH','DELETE'],
}))

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({ 
    extended: true,
    limit: "16kb"

}))

app.use(express.static("public"))
app.use(cookieParser())

//import route
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

//route declaration
app.use("/api/v1/users", userRouter);

app.use("/api/v1/videos", videoRouter);



export { app }