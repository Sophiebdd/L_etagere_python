import { Link } from "react-router-dom";

export default function PageBreadcrumb({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-purple-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.to) {
          return (
            <span
              key={item.label}
              className="rounded-full border border-purple-200/70 bg-white px-3 py-1 text-purple-800"
            >
              {item.label}
            </span>
          );
        }
        return (
          <div key={item.label} className="flex items-center gap-2">
            <Link
              to={item.to}
              className="rounded-full border border-purple-200/70 bg-white/60 px-3 py-1 transition hover:bg-purple-50 hover:text-purple-700"
            >
              {item.label}
            </Link>
            <span className="text-purple-300">›</span>
          </div>
        );
      })}
    </nav>
  );
}
