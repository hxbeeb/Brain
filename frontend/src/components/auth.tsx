import { useState } from "react";
import { Button } from "./button";
import axios from "axios";
import { BACKEND_URL } from "../config";




export default function Auth({setIsAuth}:{setIsAuth:any}){
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [name, setName] = useState("");

    const canLogin = username.trim() !== "" && password.trim() !== "";
    const canRegister = username.trim() !== "" && password.trim() !== "" && name.trim() !== "";
    
    function handleLogin(){
        console.log(username,password);
        axios.post(
            `${BACKEND_URL}/api/auth/login`,
            { username, password },
            { headers: { "Content-Type": "application/json" } }
        ).then((res)=>{
            console.log(res);
            localStorage.setItem("token",res.data.token);
            setIsAuth(true);
        }).catch((err)=>{
            console.log(err);
        })
    }
    function handleRegister(){
        console.log(username,password,name);
        axios.post(`${BACKEND_URL}/api/auth/register`,{
            username,
            password,
            name
        }, { headers: { "Content-Type": "application/json" } }).then((res)=>{
            console.log(res);
        }).catch((err)=>{
            console.log(err);
        })
    }
    return(
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
            <div className="bg-white rounded p-6 shadow w-full max-w-sm flex flex-col gap-3">
                <h1 className="text-2xl font-bold text-center">Welcome</h1>
                <input value={name} onChange={(e)=>{setName(e.target.value)}} type="text" placeholder="Name (for Register)" className="p-2 rounded border border-gray-300"/>
                <input value={username} onChange={(e)=>{setUsername(e.target.value)}} type="text" placeholder="Username" className="p-2 rounded border border-gray-300"/>
                <input value={password} onChange={(e)=>{setPassword(e.target.value)}} type="password" placeholder="Password" className="p-2 rounded border border-gray-300"/>
                <div className="flex gap-2 justify-between pt-2">
                    <Button variant="primary" size="lg" text="Login" onClick={handleLogin} disabled={!canLogin}/>
                    <Button variant="secondary" size="lg" text="Register" onClick={handleRegister} disabled={!canRegister}/>
                </div>
            </div>
        </div>
    )
}