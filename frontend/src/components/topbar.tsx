import axios from "axios";
import { BACKEND_URL } from "../config";
import { Button } from "./button";
import { useEffect, useMemo, useState } from "react";
import { CopyIcon } from "lucide-react";



export default function Topbar({ hideActions = false,setContent,content }: { hideActions?: boolean,setContent:any,content:any }){
    const [open,setOpen]=useState(false);
    const [title,setTitle]=useState("");
    const [link,setLink]=useState("");
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [url,setUrl]=useState("");
    const [type,setType]=useState("");
    const [tags,setTags]=useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [allTags, setAllTags] = useState<string[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const isValid = title.trim() !== "" && url.trim() !== "" && type.trim() !== "";

    async function handleShare(){
        await axios.post(`${BACKEND_URL}/api/share`,{},{
            headers: { token: String(localStorage.getItem("token") || "") },
        }).then((res)=>{
            setLink(res.data.shareId);
        }).catch((err)=>{
            console.log(err);
        })
    }
    async function handleDeleteShare(){
        setIsShareOpen(false);
        await axios.delete(`${BACKEND_URL}/api/v1/share/`+link.split("/").pop(),{
            headers: { token: String(localStorage.getItem("token") || "") },
        }).then((res)=>{
            console.log(res);
        }).catch((err)=>{
            console.log(err);
        })
    }

    useEffect(() => {
        // Load all tags once when modal opens
        if (open) {
            axios.get(`${BACKEND_URL}/api/v1/tags`).then((res) => {
                setAllTags(res.data?.tags || []);
            }).catch(() => {});
        }
    }, [open]);

    const filteredSuggestions = useMemo(() => {
        const q = tagInput.trim().toLowerCase();
        if (!q) return [] as string[];
        return allTags
            .filter((t) => t.toLowerCase().includes(q))
            .filter((t) => !tags.includes(t));
    }, [tagInput, allTags, tags]);

    function handleUpload(){
        axios.post(
            `${BACKEND_URL}/api/v1/content`,
            {
                title,
                description: url,
                tags,
                type,
            },
            {
                headers: { token: String(localStorage.getItem("token") || "") },
            }
        ).then((res)=>{
            console.log(res);
            setContent([...content,res.data]);
        }).catch((err)=>{
            console.log(err);
        })
        setOpen(false);
        console.log(title,url,type);
    }

    function removeTag(index: number) {
        setTags(tags.filter((_, i) => i !== index));
    }

    return(
        <div className="flex  items-center justify-end    w-full  p-4 gap-2 bg-gray-800 rounded">
            {!hideActions && (
              <>
                <Button variant="primary" size="lg" text="Share Content" onClick={()=>{
                    handleShare();
                    setIsShareOpen(true);
                }}/>
                <Button variant="secondary" size="lg" text="Add Content" onClick={()=>{setOpen(!open)}}/>
              </>
            )}
                {open && <div className="fixed inset-0 bg-black/50 z-50">
                    <div className="flex flex-col gap-2 items-center justify-center h-full">
                        <div className="flex flex-col gap-2 bg-white rounded p-4 z-50">
                            <h1 onClick={()=>{setOpen(!open)}} className="text-2xl font-bold self-end cursor-pointer">X</h1>
                            <h1 className="text-2xl font-bold">Share Content</h1>
                            <input value={title} onChange={(e)=>{setTitle(e.target.value)}} type="text" placeholder="Title" className="p-2 rounded border border-gray-300"/>
                            <input value={url} onChange={(e)=>{setUrl(e.target.value)}} type="text" placeholder="URL" className="p-2 rounded border border-gray-300"/>

                            <select value={type} onChange={(e)=>{setType(e.target.value)}} className="p-2 rounded border border-gray-300">
                                <option value="" disabled>Select type…</option>
                                <option value="Youtube">Youtube</option>
                                <option value="Twitter">Twitter</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Linkedin">Linkedin</option>
                            </select>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((t, idx) => (
                                    <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                                        {t}
                                        <button type="button" className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => removeTag(idx)}>×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="relative">
                                <input
                                    value={tagInput}
                                    onChange={(e)=> { setTagInput(e.target.value); setShowTagDropdown(true); }}
                                    onKeyDown={(e)=>{
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const raw = tagInput.trim();
                                            if (!raw) return;
                                            const normalized = raw.startsWith('#') ? raw : `#${raw}`;
                                            if (!tags.includes(normalized)) setTags([...tags, normalized]);
                                            setTagInput('');
                                            setShowTagDropdown(false);
                                        }
                                    }}
                                    onBlur={()=> setTimeout(()=> setShowTagDropdown(false), 150)}
                                    onFocus={()=> setShowTagDropdown(true)}
                                    type="text"
                                    placeholder="Tags (type to search, Enter to add)"
                                    className="p-2 rounded border border-gray-300 w-64"
                                />
                                {showTagDropdown && filteredSuggestions.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded shadow">
                                        {filteredSuggestions.map((s) => (
                                            <div
                                                key={s}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                onMouseDown={()=>{
                                                    const normalized = s.startsWith('#') ? s : `#${s}`;
                                                    if (!tags.includes(normalized)) setTags([...tags, normalized]);
                                                    setTagInput('');
                                                    setShowTagDropdown(false);
                                                }}
                                            >
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button variant="primary" size="lg" text="Share" onClick={handleUpload} disabled={!isValid}/>
                        </div>
                        
                    </div>
                </div>}
                {isShareOpen && <div className="fixed inset-0 bg-black/50 z-50">
                    <div className="flex flex-col gap-2 items-center justify-center h-full">
                        <div className="flex flex-col gap-2 bg-white rounded p-4 z-50">
                            <h1 onClick={()=>{setIsShareOpen(false)}} className="text-2xl font-bold self-end cursor-pointer">X</h1>
                            <h1 className="text-2xl font-bold">Share Content</h1>
                            <div className="flex">
                            <input value={link} disabled type="text" placeholder="Title" className="p-2 rounded border border-gray-300"/>
                            <CopyIcon className="cursor-pointer" onClick={()=>{navigator.clipboard.writeText(link)}}/>
                            </div>
                            <Button variant="primary" size="lg" text="Stop Sharing" onClick={handleDeleteShare}/>
                        </div>
                    </div>
                </div>}
        </div>
    )
}