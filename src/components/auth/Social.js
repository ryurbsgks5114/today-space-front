import Kakao from "./social/Kakao";
import Goolge from "./social/Google";
import "./auth.css";

function Socail() {
  return (
    <div className="social-container">
      <Kakao />
      <Goolge />
    </div>
  );
}

export default Socail;