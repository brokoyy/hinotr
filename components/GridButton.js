import React from 'react'


export default function GridButton({ label, subtitle, onClick, disabled, index }){
return (
<button
className={`grid-button ${disabled? 'disabled':''}`}
onClick={e=>{ if (!disabled && onClick) onClick(e) }}
aria-disabled={disabled}
>
<div className="index">{index}</div>
<div className="label">{label}</div>
{subtitle && <div className="subtitle">{subtitle}</div>}


<style jsx>{`
.grid-button{ background:#fff; border-radius:12px; padding:18px; box-shadow:0 8px 20px rgba(0,0,0,0.06); display:flex; flex-direction:column; align-items:flex-start; cursor:pointer }
.grid-button.disabled{ opacity:0.45; cursor:not-allowed }
.index{ font-weight:700; font-size:18px }
.label{ margin-top:6px; font-size:16px }
.subtitle{ margin-top:6px; font-size:12px; color:#666 }
`}</style>
</button>
)
}
