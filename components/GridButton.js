// components/GridButton.js
import React from "react";

export default function GridButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="p-4 m-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
    >
      {children}
    </button>
  );
}
