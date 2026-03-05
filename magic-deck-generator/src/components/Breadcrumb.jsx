import './Breadcrumb.css'

export default function Breadcrumb({ crumbs, language }) {
  if (!crumbs || crumbs.length <= 1) return null
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={i} className="breadcrumb-item">
          {i > 0 && <span className="breadcrumb-sep">›</span>}
          {crumb.onClick ? (
            <button className="breadcrumb-link" onClick={crumb.onClick}>
              {crumb.label}
            </button>
          ) : (
            <span className="breadcrumb-current">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
