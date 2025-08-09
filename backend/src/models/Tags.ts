import { Schema,model } from "mongoose";

const tagSchema=new Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
});

const Tag=model("Tag",tagSchema);

export { Tag };