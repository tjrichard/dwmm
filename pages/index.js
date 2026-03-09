import Link from 'next/link';
import Meta from '../components/meta';

export default function HomeHub() {
  return (
    <main className="dwmm-hub">
      <Meta
        title="DWMM | Hub"
        description="Navigate to Bookmarks and Works/Blog from a single DWMM hub."
      />
      <section className="dwmm-hub__hero">
        <p className="dwmm-hub__eyebrow">DWMM HUB</p>
        <h1>Design what matters most.</h1>
        <p className="dwmm-hub__subtitle">
          북마크 큐레이션과 Works/Blog 콘텐츠를 하나의 허브에서 시작하세요.
        </p>
      </section>

      <section className="dwmm-hub__grid" aria-label="Primary navigation">
        <Link href="/bookmarks" className="dwmm-hub__card">
          <span className="dwmm-hub__card-kicker">Curated</span>
          <h2>Bookmarks</h2>
          <p>디자인 리소스를 검색/필터/정렬하며 빠르게 탐색합니다.</p>
        </Link>

        <Link href="/works" className="dwmm-hub__card">
          <span className="dwmm-hub__card-kicker">Case studies</span>
          <h2>Works / Blog</h2>
          <p>동일한 Notion 소스에서 카테고리로 구분된 글을 확인합니다.</p>
        </Link>
      </section>
    </main>
  );
}
