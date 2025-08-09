import SidebarComp from "./sidebarComp";
import { FaSignOutAlt } from "react-icons/fa";

export default function Sidebar(){
    return(
        <div className="w-0.5/4 h-full bg-gray-300 rounded items-center flex flex-col p-4 ">
            {/* Top */}
            <h1 className="text-2xl font-bold">Brain</h1>

            {/* Center */}
            <div className="flex-1 flex items-center justify-center w-full">
                <div className="w-full">
                    <SidebarComp />
                </div>
            </div>

            {/* Bottom */}
            <div className="w-full">
                <div
                    className="flex justify-around items-center bg-red-600 hover:bg-red-700 rounded p-3 w-full cursor-pointer text-white"
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/';
                    }}
                >
                    <FaSignOutAlt />
                    <p className="text-white">Logout</p>
                </div>
            </div>
        </div>
    )
}