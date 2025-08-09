import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaYoutube } from "react-icons/fa";

const classNames="flex justify-around items-center bg-primary rounded p-3 w-full cursor-pointer"

export default function SidebarComp(){



 

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className={classNames} onClick={() => {window.location.href="https://twitter.com"}}>
        <FaTwitter />
        <p className="text-white">Twitter</p>
      </div>
      <div className={classNames} onClick={() => {window.location.href="https://instagram.com"}}>
        <FaInstagram />
        <p className="text-white">Instagram</p>
      </div>
      <div className={classNames} onClick={() => {window.location.href="https://facebook.com"}}>
        <FaFacebook />
        <p className="text-white">Facebook</p>
      </div>
      <div className={classNames} onClick={() => {window.location.href="https://linkedin.com"}}>
        <FaLinkedin />
        <p className="text-white">Linkedin</p>
      </div>
      <div className={classNames} onClick={() => {window.location.href="https://youtube.com"}}>
        <FaYoutube />
        <p className="text-white">Youtube</p>
      </div>
    </div>
  )
}