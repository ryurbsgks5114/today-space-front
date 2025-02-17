import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CheckModal from "../modal/CheckModal";
import "./mypage.css";
import AWS from 'aws-sdk';

function Profile() {
  const [profileImage, setProfileImage] = useState("/defaultProfileImg.png");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [modifyInfo, setModifyInfo] = useState({
    password: "",
    newPassword: "",
    checkPassword: "",
    username: ""
  });
  const [isModal, setIsModal] = useState(false);
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const accessToken = localStorage.getItem("accessToken");
  const navigate = useNavigate();

  // S3 설정
  const s3 = new AWS.S3({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_AWS_REGION,
  });

  const uploadToS3 = async (file) => {
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Key: `profile/${Date.now()}_${file.name}`,
      Body: file,
      ACL: 'public-read',
    };

    try {
      const { Location } = await s3.upload(params).promise();
      return Location;
    } catch (error) {
      console.error('S3 업로드 실패:', error);
      throw error;
    }
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/v1/user/profile`, {
      headers: {
        "Authorization": accessToken
      }
    }).then((res) => {
      if (res.data.statusCode === 200) {
        const imagePath = res.data.data.imagePath;
        setProfileImage(imagePath === "https://today-space.s3.ap-northeast-2.amazonaws.com/null" ? "/defaultProfileImg.png" : imagePath);
      }
    }).catch((err) => {
      if (err.response.data.message === "토큰이 만료되었습니다.") {
        axios.post(`${process.env.REACT_APP_API_URL}/v1/auth/token/refresh`, {}, {
          withCredentials: true
        }).then((res) => {
          if (res.data.statusCode === 200) {
            const newAccessToken = res.headers.authorization;
            localStorage.setItem("accessToken", newAccessToken);
            axios.get(`${process.env.REACT_APP_API_URL}/v1/user/profile`, {
              headers: {
                "Authorization": newAccessToken
              }
            }).then((res) => {
              if (res.data.statusCode === 200) {
                const imagePath = res.data.data.imagePath;
                setProfileImage(imagePath === "https://today-space.s3.ap-northeast-2.amazonaws.com/null" ? "/defaultProfileImg.png" : imagePath);
              }
            }).catch((err) => {
              console.log("프로필 조회 실패: ", err);
            });
          }
        }).catch((err) => {
          console.log("토큰 재발급 실패: ", err);
        });
      }
    });
  }, []);

  const handleInputValue = (e) => {
    const { name, value } = e.target;
    setModifyInfo({
      ...modifyInfo,
      [name]: value
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      setSelectedFile(file);
      try {
        const uploadedImageUrl = await uploadToS3(file); // S3에 업로드 후 URL 획득
        setImageUrl(uploadedImageUrl); // 업로드된 URL 저장
      } catch (error) {
        setMessage("이미지 업로드에 실패했습니다.");
      }
    }
  }

  const handleSubmit = () => {
    const { password, newPassword, checkPassword } = modifyInfo;
    const checkField = password || newPassword || checkPassword;

    if (!imageUrl && !checkField) {
      setMessage("입력값을 확인해주세요.");
      return;
    }

    if (checkField && (!password || !newPassword || !checkPassword)) {
      setMessage("비밀번호 입력란을 확인해주세요.");
      return;
    }

    if (newPassword !== checkPassword) {
      setMessage("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    const formData = new FormData();
    if (imageUrl) {
      formData.append("profileImageUrl", imageUrl); // URL을 formData에 추가
    }

    if (password && newPassword && checkPassword) {
      formData.append("data", new Blob([JSON.stringify({ password, newPassword, checkPassword })], { type: "application/json" }));
    }

    axios.patch(`${process.env.REACT_APP_API_URL}/v1/user/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': accessToken
      }
    }).then((res) => {
      if (res.data.statusCode === 200) {
        navigate("/mypage/post");
      }
    }).catch((err) => {
      if (err.response.data.message === "토큰이 만료되었습니다.") {
        axios.post(`${process.env.REACT_APP_API_URL}/v1/auth/token/refresh`, {}, {
          withCredentials: true
        }).then((res) => {
          if (res.data.statusCode === 200) {
            const newAccessToken = res.headers.authorization;
            axios.patch(`${process.env.REACT_APP_API_URL}/v1/user/profile`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': newAccessToken
              }
            }).then((res) => {
              if (res.data.statusCode === 200) {
                localStorage.setItem("accessToken", newAccessToken);
                navigate("/mypage/post");
              }
            }).catch((err) => {
              if (err.response.data.message === "비밀번호를 확인해주세요.") {
                setMessage("비밀번호를 확인해주세요.");
              }
              if (err.response.data.message === "이전 비밀번호와 동일합니다.") {
                setMessage("이전 비밀번호와 동일합니다.");
              }
            });
          }
        }).catch((err) => {
          console.log("토큰 재발급 실패: ", err);
        });
      }
      if (err.response.data.message === "비밀번호를 확인해주세요.") {
        setMessage("비밀번호를 확인해주세요.");
      }
      if (err.response.data.message === "이전 비밀번호와 동일합니다.") {
        setMessage("이전 비밀번호와 동일합니다.");
      }
    });
  };

  const handleUsernameChange = () => {
    const { username } = modifyInfo;
    if (!username) {
      setNewMessage("아이디를 입력해주세요.");
      return;
    }

    axios.put(`${process.env.REACT_APP_API_URL}/v1/user/username`, {
      username: modifyInfo.username,
    }, {
      headers: {
        "Authorization": accessToken
      }
    }).then((res) => {
      if (res.data.statusCode === 200) {
        localStorage.setItem("accessToken", res.headers.authorization);
        localStorage.setItem("username", modifyInfo.username);
        setNewMessage("");
        setIsModal(true);
      }
    }).catch((err) => {
      if (err.response.data.message === "토큰이 만료되었습니다.") {
        axios.post(`${process.env.REACT_APP_API_URL}/v1/auth/token/refresh`, {}, {
          withCredentials: true
        }).then((res) => {
          if (res.data.statusCode === 200) {
            const newAccessToken = res.headers.authorization;
            axios.put(`${process.env.REACT_APP_API_URL}/v1/user/username`, {
              username: modifyInfo.username,
            }, {
              headers: {
                "Authorization": newAccessToken
              }
            }).then((res) => {
              if (res.data.statusCode === 200) {
                localStorage.setItem("accessToken", res.headers.authorization);
                localStorage.setItem("username", modifyInfo.username);
                setNewMessage("");
                setIsModal(true);
              }
            }).catch((err) => {
              if (err.response.data.message === "입력값을 확인해주세요.") {
                setNewMessage("입력값을 확인해주세요.");
                return;
              }

              if (err.response.data.message === "사용 중인 아이디입니다.") {
                setNewMessage("사용 중인 아이디입니다.");
                return;
              }
            });
          }
        }).catch((err) => {
          console.log("토큰 재발급 실패: ", err);
        });
      }

      if (err.response.data.message === "입력값을 확인해주세요.") {
        setNewMessage("입력값을 확인해주세요.");
        return;
      }
      
      if (err.response.data.message === "사용 중인 아이디입니다.") {
        setNewMessage("사용 중인 아이디입니다.");
        return;
      }

    });
  };

  const handleCancle = () => {
    navigate("/mypage/post");
  }

  const handleCheckModal = () => {
    setIsModal(false);
  };

  return (
      <div className="profile-container">
        <h1>프로필 수정</h1>

        <div className="profile-container-image">
          <img src={profileImage} alt="defaultProfileImg" />
        </div>

        <div className="profile-container-form">
          <label htmlFor="profile-image">프로필 이미지 변경</label>
          <input
              type="file"
              id="profile-image"
              name="profile-image"
              accept="image/*"
              onChange={handleImageChange}
          />
        </div>

        <div className="profile-container-form">
          <label htmlFor="username">아이디 변경</label>
          <input
              className="profile-container-form-username"
              type="text"
              id="username"
              name="username"
              onChange={handleInputValue}
              placeholder="새 아이디를 입력해주세요"
          />
          <button className="profile-container-form-username-button" onClick={handleUsernameChange}>아이디 변경</button>
        </div>

        {newMessage ? <div className="profile-container-message">{newMessage}</div> : null}

        <div className="profile-container-form">
          <label htmlFor="password">현재 비밀번호</label>
          <input
              type="password"
              id="password"
              name="password"
              onChange={handleInputValue}
              placeholder="현재 비밀번호를 입력해주세요"
          />
        </div>

        <div className="profile-container-form">
          <label htmlFor="newPassword">새 비밀번호</label>
          <input
              type="password"
              id="newPassword"
              name="newPassword"
              onChange={handleInputValue}
              placeholder="새 비밀번호를 입력해주세요"
          />
        </div>

        <div className="profile-container-form">
          <label htmlFor="checkPassword">새 비밀번호 확인</label>
          <input
              type="password"
              id="checkPassword"
              name="checkPassword"
              onChange={handleInputValue}
              placeholder="새 비밀번호를 다시 입력해주세요"
          />
        </div>

        {message ? <div className="profile-container-message">{message}</div> : null}

        <div className="profile-container-button">
          <button className="profile-container-button-submit" onClick={handleSubmit}>변경 사항 저장</button>
          <button className="profile-container-button-cancle" onClick={handleCancle}>취소</button>
        </div>

        {isModal ? <CheckModal content={"아이디 변경이 완료되었습니다."} handler={handleCheckModal} /> : null}
      </div>
  );
}

export default Profile;
