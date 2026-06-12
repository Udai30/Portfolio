// ============================================================
// PROJECT SANDBOX REGISTRY
// ============================================================
// Each entry powers one window. To plug in a real demo later,
// set `demo` to either:
//   - a local path  : 'projects/pyxel-runner/index.html'
//     (drop a web build of the project into that folder)
//   - an external URL: 'https://your-demo.example.com'
// Leave `demo: null` to show the "coming soon" placeholder.
//
// Optional per-project fields:
//   width / height — initial window size in px
//   sandbox        — override the iframe sandbox attribute
// ============================================================
 
const PROJECTS = {
  'powerbi-dashboard': {
    title: 'Power BI Online Courses Dashboard',
    glyph: '📊',
    demo: null, // e.g. 'https://app.powerbi.com/view?r=...' (Publish to web link)
    width: 860,
    height: 560,
    about:
      'Interactive Power BI dashboard visualizing online course data — enrollment trends, completion rates, engagement metrics, and DAX-driven KPIs.',
  },
 
  'football-ml': {
    title: 'Football Player Value Prediction',
    glyph: '⚽',
    demo: null, // e.g. 'projects/football-ml/index.html' or a hosted Streamlit URL
    width: 760,
    height: 540,
    about:
      'ML model predicting football player market value using Linear Regression, Random Forest, and XGBoost with engineered features and cross-validation.',
  },
 
  'pyxel-runner': {
    title: 'Pyxel Runner — 2D Runner Game',
    glyph: '🕹️',
    demo: null, // e.g. 'projects/pyxel-runner/index.html' (pygbag/wasm web build)
    width: 720,
    height: 520,
    about:
      'Retro 2D infinite runner built with Pygame — procedural obstacles, pixel-art animation, score tracking, and difficulty scaling.',
  },
};