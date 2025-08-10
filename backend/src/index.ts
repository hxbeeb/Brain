import express from "express";
import type { Request } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "./models/User.js";
import { Share } from "./models/Share.js";
import { Content } from "./models/Content.js";
import { Tag } from "./models/Tags.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
// Extend Express Request interface to include username
interface AuthenticatedRequest extends Request {
    username?: string;
    userId?:string;
}

const app = express();
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
}));


const JWt_SECRET=process.env.JWT_SECRET||"";
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL||"").then(()=>{
    console.log("Connected to MongoDB");
}).catch((e)=>{
    console.log("Error connecting to MongoDB:", e);
});

async function auth(req: any, res: any, next: Function) {
    console.log("auth",req.headers);

    const token = req.headers.token;
 
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
      
        try {
           let  decoded = jwt.verify(token, JWt_SECRET);
            // jwt.verify can return string or JwtPayload, so we need to check type
            if (typeof decoded !== "object" || decoded === null || !("username" in decoded)) {
                return res.status(401).json({ error: "Invalid token payload" });
            }
            const { username } = decoded as { username: string };
            req.username = username;

            // Correct usage: find user by username
            const user = await User.findOne({ username: username });
            req.userId=user?._id;
            if (!user) {
                return res.status(401).json({ error: "User not found" });
            }
            next();
}
catch(e){
    return res.status(401).json({error:"Invalid token"});
}};


// app.get("/api/auth/me",auth, async (req:AuthenticatedRequest, res) => {
//     try{
//         res.status(200).json({message:"User authenticated",user:req.username}); 
//         }
//         catch(e){
//             res.status(500).json({error:"Failed to get content"});
//         }
// });

app.get("/api/v1/auth/me",auth, async (req:AuthenticatedRequest, res) => {
    try{
    res.status(200).json({message:"User authenticated",user:req.username}); 
    }
    catch(e){
        res.status(500).json({error:"Failed to get content"});
    }
});



app.post("/api/auth/register", async (req, res) => {
    const { username, password, name } = req.body ?? {};
    try{
        console.log(req.body);
    if (!username || !password || !name) {
        return res.status(400).json({ error: "username, password and name are required" });
    }
    const hashedPassword=await bcrypt.hash(password,10);
    console.log(hashedPassword);
    const user=await User.create({
        username:username,
        password:hashedPassword,
        name:name,
    })
    console.log(user);
    res.status(200).json({message:"User created successfully"});
    }
    catch(e:any){
        res.status(500).json({error:e.message});
    }
});
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    try{
    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }
    const user=await User.findOne({username:username});
    if(!user){
        return res.status(401).json({error:"User not found"});
    }
    const isPasswordValid=await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(401).json({error:"Invalid password"});
    }
    const token=jwt.sign({username:username},JWt_SECRET,{expiresIn:"1h"});
    res.status(200).json({token:token});
    }
    catch(e){
        res.status(500).json({error:"Failed to login"});
    }
});

app.post("/api/v1/content",auth, async (req:AuthenticatedRequest, res) => {
    const{title,description,tags,type}=req.body;
    try{
    const content=await Content.create({
        userId:req.userId,
        title:title,
        type:type,
        description:description,
        tags:tags,
        
    });
    
    // Create individual Tag documents from the tags array
    if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
            try {
                // Check if tag already exists
                const existingTag = await Tag.findOne({ name: tagName });
                if (!existingTag) {
                    // Create new Tag document only if it doesn't exist
                    await Tag.create({ name: tagName });
                }
            } catch (tagError) {
                console.error(`Error creating tag ${tagName}:`, tagError);
                // Continue with other tags even if one fails
            }
        }
    }
    
    res.status(200).json({message:"Content created successfully",content:content});
    }
    catch(e){
        res.status(500).json({error:"Failed to create content"});
    }
});
app.get("/api/v1/content",auth, async (req:AuthenticatedRequest, res) => {
    try{
    const content=await Content.find({userId:req.userId});
    res.status(200).json({content:content});
    }
    catch(e){
        res.status(500).json({error:"Failed to get content"});
    }
});

// Get all tags
app.get("/api/v1/tags", async (_req, res) => {
    try {
        const tags = await Tag.find({}, { name: 1, _id: 0 });
        res.status(200).json({ tags: tags.map((t:any) => t.name) });
    } catch (e:any) {
        res.status(500).json({ error: e.message || "Failed to get tags" });
    }
});

// Update content
app.put("/api/v1/content/:id", auth, async (req: AuthenticatedRequest, res) => {
    const contentId = req.params.id;
    const { title, description, tags } = req.body ?? {};
    try {
        const updated = await Content.findOneAndUpdate(
            { _id: contentId, userId: req.userId },
            {
                ...(title !== undefined ? { title } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(Array.isArray(tags) ? { tags } : {}),
            },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: "Content not found" });
        }
        res.status(200).json({ message: "Content updated", content: updated });
    } catch (e:any) {
        res.status(500).json({ error: e.message || "Failed to update content" });
    }
});

// Delete content
app.delete("/api/v1/content/:id", auth, async (req: AuthenticatedRequest, res) => {
    const contentId = req.params.id;
    try {
        const deleted = await Content.findOneAndDelete({ _id: contentId, userId: req.userId });
        if (!deleted) {
            return res.status(404).json({ error: "Content not found" });
        }
        res.status(200).json({ message: "Content deleted" });
    } catch (e:any) {
        res.status(500).json({ error: e.message || "Failed to delete content" });
    }
});





app.post("/api/share",auth, async (req: AuthenticatedRequest, res) => {
    const username = req.username;
    const user=await Share.findOne({userId:req.userId});
    if(user){
        return res.status(200).json({shareId:"http://localhost:5173/s/"+user.shareId});
    }
    const shareId=Math.random().toString(36).substring(2,15);
    try{
    const share=await Share.create({
        shareId:shareId,
        userId:req.userId,
    })
    res.status(200).json({shareId:process.env.FRONTEND_URL+"/s/"+shareId});
    console.log(share);
    }
    catch(e){
        res.status(500).json({error:"Failed to create share"});
    }
});

app.get("/api/v1/:shareId",async (req:AuthenticatedRequest,res)=>{
    const shareId=req.params.shareId;
    console.log(shareId);
    try{
    const shared=await Share.findOne({shareId:shareId});
    console.log(shared);
    const user=await User.findOne({_id:shared?.userId});
    console.log(user?._id);
    const content=await Content.find({userId:user?._id});
    console.log(content);
    res.status(200).json({
        owner: {
            name: user?.name,
            username: user?.username,
        },
        content
    });
    }
    catch(e:any){
        res.status(500).json({error:e.message});
    }


})

app.delete("/api/v1/share/:id",auth, async (req:AuthenticatedRequest,res)=>{
    const shareId=req.params.id;
    try{
    const deleted=await Share.findOneAndDelete({shareId:shareId});
    res.status(200).json({message:"Share deleted"});
    }
    catch(e:any){
        res.status(500).json({error:e.message});
    }
})




app.listen(3000, () => {
    console.log("Server is running on port 3000");
});