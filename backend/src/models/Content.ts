import { Schema,model } from "mongoose";

const contentSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    tags:[{
        type:String,
       
       
    }],

});

const Content=model("Content",contentSchema);

export { Content };