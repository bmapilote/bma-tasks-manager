export function ThemeScript() {
  const script = `
    (function() {
      var theme = localStorage.getItem('theme') || 'system';
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
      if (resolved === 'dark') document.documentElement.classList.add('dark');
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
