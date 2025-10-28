export default function ThemeScript() {
  const code = `(function(){
    try {
      var saved = localStorage.getItem('theme');
      var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = saved || (prefers ? 'dark' : 'light');
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (e) {}
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
