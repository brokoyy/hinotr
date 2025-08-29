// hinotr/components/GridButton.js
import React from 'react'

export default function GridButton({ index, label, subtitle, onClick, disabled }) {
  return (
    <div
      className={`grid-button${disabled ? ' disabled' : ''}`}
      onClick={() => !disabled && onClick()}
    >
      <div className="index">{index}</div>
      <div className="label">{label}</div>
      <div className="subtitle">{subtitle}</div>

      <style jsx>{`
        .grid-button {
          background: #fff;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 120px;
          cursor: pointer;
          text-align: center;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .grid-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        }
        .grid-button.disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .index {
          font-weight: 700;
          font-size: 20px;
        }
        .label {
          margin-top: 8px;
          font-size: 18px;
        }
        .subtitle {
          margin-top: 6px;
          font-size: 14px;
          color: #666;
        }
      `}</style>
    </div>
  )
}
