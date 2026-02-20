"use client";
import React, { useState } from "react";

export default function Pagination({ totalPages = 4 }) {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <li
          key={i}
          className={`page-item ${currentPage === i ? "active" : ""}`}
        >
          <a
            className="page-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageClick(i);
            }}
          >
            {i}
          </a>
        </li>
      );
    }
    return pageNumbers;
  };

  return (
    <>
      {/* Left Arrow Button */}

      <li className="page-item previous-page">
        <a
          className="page-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handlePrevPage();
          }}
        >
          <i className="fas fa-arrow-left" />
        </a>
      </li>

      {/* Page Numbers */}
      {renderPageNumbers()}

      {/* Right Arrow Button */}
      <li className="page-item next-page">
        <a
          className="page-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNextPage();
          }}
        >
          <i className="fas fa-arrow-right" />
        </a>
      </li>
    </>
  );
}
