import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './post.css';

const SearchTags = ({ onTagClick, selectedTag }) => {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetchTopTags();
  }, []);

  const fetchTopTags = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/v1/hashtags`);
      const data = response.data.data;
      setTags(['전체', ...data]); // '전체' 태그를 목록의 처음에 추가
    } catch (error) {
      console.error('Error fetching top tags', error);
    }
  };

  return (
      <div className="search-tags-container">
        <div className="search-tags-wrapper">
          <div className="search-tags-content">
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className={`search-tag ${selectedTag === tag ? 'selected' : ''}`}
                    onClick={() => onTagClick(tag)}
                    style={{ cursor: 'pointer' }}
                >
              #{tag}
            </span>
            ))}
          </div>
        </div>
      </div>
  );
};

export default SearchTags;
