import { Schema,model } from "mongoose";


const shareSchema=new Schema({
    shareId:{
        type:String,
    
        unique:true,
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
});

const Share=model("Share",shareSchema);

export { Share };
