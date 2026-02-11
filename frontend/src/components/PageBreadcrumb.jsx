import { Link } from "react-router-dom";

export default function PageBreadcrumb({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B8C5E5]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.to) {
          return (
            <span
              key={item.label}
              className="rounded-full border border-[#B8C5E5]/70 bg-white px-3 py-1 text-[#B8C5E5]"
            >
              {item.label}
            </span>
          );
        }
        return (
          <div key={item.label} className="flex items-center gap-2">
            <Link
              to={item.to}
              className="rounded-full border border-[#B8C5E5]/70 bg-white/60 px-3 py-1 transition hover:bg-[#B8C5E5] hover:text-[#B8C5E5]"
            >
              {item.label}
            </Link>
            <span className="text-[#B8C5E5]">›</span>
          </div>
        );
      })}
    </nav>
  );
}
