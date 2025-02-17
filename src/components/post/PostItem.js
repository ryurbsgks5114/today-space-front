import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { SamplePrevArrow, SampleNextArrow } from './SliderArrows';
import './post.css';

const PostItem = ({ profileImage, nickname, postImage, likeCount, content, date, tags, postId, onTagClick, selectedTag, images }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(likeCount);
  const [currentSlide, setCurrentSlide] = useState(0);
  const token = localStorage.getItem('accessToken');
  const currentUsername = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    if (postId) {
      checkIfLiked();
    }
  }, [postId]);

  const checkIfLiked = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/v1/posts/${postId}/likes`, {
        headers: {
          Authorization: token,
        },
      });
      setIsLiked(response.data.data.isLiked);
    } catch (error) {
      console.error('Error checking like status', error);
    }
  };

  const handleLikeToggle = async () => {
    if (!token) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/v1/posts/${postId}/likes`, {}, {
        headers: {
          Authorization: token,
        },
      });
      setIsLiked(response.data.data.isLiked);
      setLikes(response.data.data.likeCount);
    } catch (error) {
      console.error('Error toggling like', error);
    }
  };

  const handleEditClick = () => {
    navigate(`/post/edit/${postId}`);
  };

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: currentSlide !== 0 && <SamplePrevArrow />,
    nextArrow: currentSlide !== images.length - 1 && <SampleNextArrow />,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
    adaptiveHeight: true,
  };

  const fullProfileImageUrl = profileImage ? `${profileImage}` : 'https://via.placeholder.com/36';

  return (
      <div className="left-content">
        <div className="post-header">
          <div className="post-title">
            <img src={fullProfileImageUrl} alt="프로필 이미지" className="profile-image" />
            {nickname}
          </div>
          {currentUsername === nickname && <button className="edit-button" onClick={handleEditClick}>편집</button>}
        </div>

        <Slider {...settings} className="post-image-slider">
          {images.map((image, index) => (
              <div key={index}>
                <img src={image.imagePath} alt={`포스트 이미지 ${index + 1}`} className="post-image" />
              </div>
          ))}
        </Slider>

        <div className="post-actions">
          <button className="like-button" onClick={handleLikeToggle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'red' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 0L3 6.67a5.5 5.5 0 0 0 0 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            좋아요 {likes}
          </button>
        </div>

        <div className="post-content">
          <p><span className="nickname">{nickname}</span> {content}</p>
        </div>

        <div className="post-date">{date}</div>

        <div className="post-tags">
          {tags.map((tag, index) => (
              <span
                  key={index}
                  className={`tag ${selectedTag === tag ? 'selected' : ''}`}
                  onClick={() => onTagClick(tag)}
                  style={{ cursor: 'pointer' }}
              >
            #{tag}
          </span>
          ))}
        </div>
      </div>
  );
};

export default PostItem;